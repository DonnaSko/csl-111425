import { useState, useRef } from 'react';
import Papa, { ParseResult } from 'papaparse';
import api from '../services/api';

interface CSVUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface DealerRow {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  address?: string;
  buyingGroup?: string;
  status?: string;
}

interface DuplicateInfo {
  dealer: DealerRow;
  existingId?: string;
  existing?: {
    companyName: string;
    email?: string;
    phone?: string;
    contactName?: string;
  };
}

const CSVUpload = ({ onSuccess, onCancel }: CSVUploadProps) => {
  const [step, setStep] = useState<'upload' | 'review' | 'importing' | 'complete'>('upload');
  const [_file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<DealerRow[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [newDealers, setNewDealers] = useState<DealerRow[]>([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');
  const [importResult, setImportResult] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setError('No file selected. Please choose a CSV file.');
      return;
    }

    // Check file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['csv', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'txt', 'rtf'];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setError(`File type not supported. Please select: ${allowedExtensions.join(', ').toUpperCase()}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // For non-CSV files, upload directly
    if (fileExtension !== 'csv') {
      handleNonCSVUpload(selectedFile);
      return;
    }

    setFile(selectedFile);
    setError('');
    setIsParsing(true);

    // Parse CSV - read file first
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          return;
        }

        const data = results.data as any[];
        
        if (!data || data.length === 0) {
          setError('CSV file appears to be empty or has no data rows. Please check your file.');
          return;
        }

        const normalizedData: DealerRow[] = data.map(row => {
          // Normalize column names (case-insensitive, handle spaces)
          const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '');
          const getValue = (keys: string[]) => {
            for (const key of keys) {
              const found = Object.keys(row).find(k => normalizeKey(k) === normalizeKey(key));
              if (found && row[found]) return row[found].trim();
            }
            return '';
          };

          const phoneValue = getValue(['phone', 'telephone', 'tel', 'phone number', 'phonenumber']);
          const emailValue = getValue(['email', 'e-mail', 'email address']);
          
          return {
            companyName: getValue(['companyname', 'company', 'company name', 'business name', 'businessname']) || '',
            contactName: getValue(['contactname', 'contact', 'contact name', 'name', 'person']),
            email: emailValue ? emailValue.toLowerCase().trim() : undefined,
            phone: phoneValue ? phoneValue.trim() : undefined,
            city: getValue(['city']),
            state: getValue(['state', 'province']),
            zip: getValue(['zip', 'zipcode', 'postal code', 'postalcode', 'postcode']),
            country: getValue(['country']),
            address: getValue(['address', 'street', 'street address']),
            buyingGroup: getValue(['buyinggroup', 'buying group', 'group']),
            status: getValue(['status']) || 'Prospect'
          };
        }).filter(row => row.companyName); // Filter out rows without company name

        if (normalizedData.length === 0) {
          setError('No valid dealers found in CSV. Make sure your CSV has a "Company Name" column with data.');
          return;
        }

          setParsedData(normalizedData);
          setIsParsing(false);
          checkDuplicates(normalizedData);
        },
        error: (error: Error) => {
          console.error('CSV parse error:', error);
          setIsParsing(false);
          setError(`Failed to parse CSV file: ${error.message || 'Unknown error'}. Please make sure your file is a valid CSV file.`);
        }
      });
    };
    reader.onerror = () => {
      setIsParsing(false);
      setError('Failed to read file. Please try again.');
    };
    reader.readAsText(selectedFile);
  };

  const checkDuplicates = async (data: DealerRow[]) => {
    try {
      setError('');
      
      if (!data || data.length === 0) {
        setError('No dealers to check. Please ensure your CSV has valid data.');
        return;
      }

      const response = await api.post('/dealers/check-duplicates', { dealers: data });
      
      if (!response.data) {
        setError('Invalid response from server. Please try again.');
        return;
      }

      setDuplicates(response.data.duplicateList || []);
      setNewDealers(response.data.newList || []);
      setStep('review');
    } catch (err: any) {
      console.error('Check duplicates error:', err);
      const errorMessage = err.response?.data?.error 
        || err.message 
        || 'Failed to check for duplicates. Please check your connection and try again.';
      setError(errorMessage);
      
      // If it's a 403, might be subscription issue
      if (err.response?.status === 403) {
        setError('Subscription required. Please check your subscription status.');
      } else if (err.response?.status === 401) {
        setError('Please log in again and try again.');
      }
    }
  };

  const handleImport = async (skipDuplicates: boolean) => {
    try {
      setStep('importing');
      setError('');

      // Combine new dealers with selected duplicates (if not skipping)
      const dealersToImport = skipDuplicates
        ? newDealers
        : [
            ...newDealers,
            ...duplicates.filter((_, index) => selectedDuplicates.has(index))
          ];

      const response = await api.post('/dealers/bulk-import', {
        dealers: dealersToImport,
        skipDuplicates
      });

      setImportResult(response.data);
      setStep('complete');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import dealers');
      setStep('review');
    }
  };

  const handleNonCSVUpload = async (file: File) => {
    try {
      setIsParsing(true);
      setError('');

      console.log('Uploading non-CSV file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const formData = new FormData();
      formData.append('file', file);
      // Note: Don't append 'type' as it's not needed and might confuse multer

      const response = await api.post('/uploads/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for large files
      });

      console.log('Upload response:', response.data);

      setIsParsing(false);
      setImportResult({
        message: `File "${file.name}" uploaded successfully`,
        count: 1,
        file: response.data
      });
      setStep('complete');
    } catch (err: any) {
      console.error('File upload error:', err);
      setIsParsing(false);
      
      let errorMessage = 'Failed to upload file. Please try again.';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection and try again.';
      } else if (err.message) {
        // Error in request setup
        errorMessage = err.message;
      }
      
      // Handle specific error codes
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid file. Please check the file type and size.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large. Maximum file size is 50MB.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Subscription required. Please check your subscription status.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in again and try again.';
      }
      
      setError(errorMessage);
    }
  };

  const toggleDuplicate = (index: number) => {
    const newSet = new Set(selectedDuplicates);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedDuplicates(newSet);
  };

  if (step === 'upload') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Upload File</h2>
          <p className="text-gray-600 mb-4">
            <strong>For CSV files:</strong> Upload a CSV file with your dealers. Required column: <strong>Company Name</strong>.
            Optional columns: Contact Name, Email, Phone, City, State, Zip, Country, Address, Buying Group, Status.
            <br /><br />
            <strong>For other files:</strong> PDF, Excel, Word, Pages, and other document formats will be uploaded and stored.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pdf,.xls,.xlsx,.doc,.docx,.pages,.txt,.rtf"
            onChange={handleFileSelect}
            className="mb-4 w-full px-4 py-2 border border-gray-300 rounded-lg"
            disabled={isParsing}
          />
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: CSV, PDF, Excel (XLS, XLSX), Word (DOC, DOCX), Pages, TXT, RTF
          </p>

          {isParsing && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
              Parsing CSV file...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
          <h2 className="text-2xl font-bold mb-4">Review Import</h2>
          
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{parsedData.length}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{newDealers.length}</div>
              <div className="text-sm text-gray-600">New Dealers</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{duplicates.length}</div>
              <div className="text-sm text-gray-600">Potential Duplicates</div>
            </div>
          </div>

          {duplicates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Potential Duplicates</h3>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {duplicates.map((dup, index) => (
                  <div
                    key={index}
                    className={`p-3 border-b flex items-start gap-3 cursor-pointer hover:bg-gray-50 ${
                      selectedDuplicates.has(index) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleDuplicate(index)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDuplicates.has(index)}
                      onChange={() => toggleDuplicate(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{dup.dealer.companyName}</div>
                      {dup.existing && (
                        <div className="text-sm text-gray-600">
                          Matches existing: {dup.existing.companyName}
                          {dup.existing.email && ` (${dup.existing.email})`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Check duplicates you want to import anyway, or skip them all.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setDuplicates([]);
                setNewDealers([]);
                setStep('upload');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Choose Different File
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {duplicates.length > 0 && (
              <button
                onClick={() => handleImport(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Skip Duplicates & Import
              </button>
            )}
            <button
              onClick={() => handleImport(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Import {selectedDuplicates.size > 0 ? `(${newDealers.length + selectedDuplicates.size} dealers)` : `(${newDealers.length} dealers)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Importing dealers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Import Complete!</h2>
          <div className="mb-4">
            {importResult?.message ? (
              <p className="text-lg">{importResult.message}</p>
            ) : (
              <>
                <p className="text-lg">
                  Successfully imported <strong>{importResult?.count || 0}</strong> dealers
                </p>
                {importResult?.duplicates > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {importResult.duplicates} duplicates were skipped
                  </p>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => {
              onSuccess();
              setStep('upload');
              setFile(null);
              setParsedData([]);
              setDuplicates([]);
              setNewDealers([]);
              setSelectedDuplicates(new Set());
              setImportResult(null);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CSVUpload;

