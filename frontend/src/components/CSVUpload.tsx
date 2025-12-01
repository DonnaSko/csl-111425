import { useState, useRef, useEffect } from 'react';
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

  // Error boundary - catch any unhandled errors to prevent blank screen
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error in CSVUpload:', event.error);
      setError('An unexpected error occurred. Please try again or contact support.');
      setStep('upload');
      setIsParsing(false);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in CSVUpload:', event.reason);
      setError('An unexpected error occurred. Please try again or contact support.');
      setStep('upload');
      setIsParsing(false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

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
          try {
            if (results.errors.length > 0) {
              setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
              setIsParsing(false);
              return;
            }

            const data = results.data as any[];
            
            if (!data || data.length === 0) {
              setError('CSV file appears to be empty or has no data rows. Please check your file.');
              setIsParsing(false);
              return;
            }

            const normalizedData = data
              .map((row): DealerRow | null => {
                try {
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
                  
                  const companyName = getValue(['companyname', 'company', 'company name', 'business name', 'businessname']) || '';
                  
                  // Only return valid rows with company name
                  if (!companyName) {
                    return null;
                  }
                  
                  return {
                    companyName,
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
                } catch (rowError) {
                  console.error('Error processing row:', rowError, row);
                  return null;
                }
              })
              .filter((row): row is DealerRow => row !== null && row.companyName !== '') as DealerRow[]; // Filter out null rows and rows without company name

            if (normalizedData.length === 0) {
              setError('No valid dealers found in CSV. Make sure your CSV has a "Company Name" column with data.');
              setIsParsing(false);
              return;
            }

            setParsedData(normalizedData);
            setIsParsing(false);
            checkDuplicates(normalizedData).catch((err) => {
              console.error('Error in checkDuplicates:', err);
              setError('Failed to check for duplicates. Please try again.');
              setIsParsing(false);
              setStep('upload');
            });
          } catch (parseError) {
            console.error('Error in CSV parse complete handler:', parseError);
            setError('An error occurred while processing the CSV file. Please try again.');
            setIsParsing(false);
          }
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
      setIsParsing(true);
      
      if (!data || data.length === 0) {
        setError('No dealers to check. Please ensure your CSV has valid data.');
        setIsParsing(false);
        setStep('upload');
        return;
      }

      // For very large datasets, skip duplicate check and go straight to import
      // This prevents timeouts and memory issues
      if (data.length > 1000) {
        console.log(`Large dataset (${data.length} dealers), skipping duplicate check to prevent timeout...`);
        setDuplicates([]);
        setNewDealers(data);
        setIsParsing(false);
        setStep('review');
        return;
      }

      console.log(`Checking duplicates for ${data.length} dealers...`);
      const response = await api.post('/dealers/check-duplicates', { dealers: data }, {
        timeout: 300000, // 5 minute timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      if (!response || !response.data) {
        setError('Invalid response from server. Please try again.');
        setIsParsing(false);
        setStep('upload');
        return;
      }

      console.log('Duplicate check complete:', {
        duplicates: response.data.duplicateList?.length || 0,
        new: response.data.newList?.length || 0
      });

      setDuplicates(response.data.duplicateList || []);
      setNewDealers(response.data.newList || []);
      setIsParsing(false);
      setStep('review');
    } catch (err: any) {
      console.error('Check duplicates error:', err);
      setIsParsing(false);
      
      let errorMessage = 'Failed to check for duplicates. Please check your connection and try again.';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // On timeout, skip duplicate check and proceed with import
        console.log('Duplicate check timed out, proceeding without duplicate check...');
        setDuplicates([]);
        setNewDealers(parsedData);
        setStep('review');
        return;
      } else if (err.response?.status === 413) {
        // Request too large - skip duplicate check
        console.log('Request too large for duplicate check, proceeding without duplicate check...');
        setDuplicates([]);
        setNewDealers(parsedData);
        setStep('review');
        return;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // If it's a 403, might be subscription issue
      if (err.response?.status === 403) {
        errorMessage = 'Subscription required. Please check your subscription status.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in again and try again.';
      }
      
      setError(errorMessage);
      setStep('upload'); // Always return to upload step on error
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

      if (dealersToImport.length === 0) {
        setError('No dealers to import. Please check your selection.');
        setStep('review');
        return;
      }

      console.log(`Starting bulk import of ${dealersToImport.length} dealers...`);

      const response = await api.post('/dealers/bulk-import', {
        dealers: dealersToImport,
        skipDuplicates
      }, {
        timeout: 600000, // 10 minute timeout for very large imports
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('Bulk import response:', response.data);

      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      setImportResult(response.data);
      setStep('complete');
    } catch (err: any) {
      console.error('Bulk import error:', err);
      
      // Always ensure we're in a valid state, never leave blank screen
      let errorMessage = 'Failed to import dealers';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Import timed out. The file may be too large. Please try splitting it into smaller files (500 dealers per file) or contact support.';
      } else if (err.response?.status === 413) {
        errorMessage = 'Request too large. Please split your file into smaller files (500 dealers per file).';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // Always return to review step so user can see the error and try again
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
        timeout: 300000, // 5 minute timeout for large files (increased from 2 minutes)
        maxContentLength: 104857600, // 100MB
        maxBodyLength: 104857600, // 100MB
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
        errorMessage = err.response.data?.error || 'File too large. Maximum file size is 100MB. Please try a smaller file or split your CSV into multiple files.';
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
    const totalDealers = newDealers.length + (selectedDuplicates.size > 0 ? selectedDuplicates.size : 0);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold mb-2">Importing dealers...</p>
            <p className="text-sm text-gray-600 mb-2">Please wait, this may take a few minutes for large files.</p>
            <p className="text-xs text-gray-500">Importing {totalDealers} dealers...</p>
            <div className="mt-4 text-xs text-gray-400">
              Do not close this window
            </div>
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
              <p className="text-lg mb-2">{importResult.message}</p>
            ) : (
              <>
                <p className="text-lg mb-2">
                  Successfully imported <strong>{importResult?.count || 0}</strong> dealers
                </p>
              </>
            )}
            {importResult?.duplicates > 0 && (
              <p className="text-sm text-gray-600 mb-1">
                {importResult.duplicates} duplicates were skipped
              </p>
            )}
            {importResult?.errors > 0 && (
              <p className="text-sm text-yellow-600 mb-1">
                {importResult.errors} rows had errors
              </p>
            )}
            {importResult?.duration && (
              <p className="text-xs text-gray-500 mt-2">
                Completed in {importResult.duration}
              </p>
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

  // Fallback - should never reach here, but if we do, show upload screen
  // This prevents blank screens by always rendering something
  console.warn('CSVUpload component reached unexpected state, defaulting to upload screen');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Upload File</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        <p className="text-gray-600 mb-4">
          Please select a file to upload.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf,.xls,.xlsx,.doc,.docx,.pages,.txt,.rtf"
          onChange={handleFileSelect}
          className="mb-4 w-full px-4 py-2 border border-gray-300 rounded-lg"
          disabled={isParsing}
        />
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
};

export default CSVUpload;

