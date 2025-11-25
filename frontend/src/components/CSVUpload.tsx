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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<any>) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          return;
        }

        const data = results.data as any[];
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

          return {
            companyName: getValue(['companyname', 'company', 'company name', 'business name', 'businessname']) || '',
            contactName: getValue(['contactname', 'contact', 'contact name', 'name', 'person']),
            email: getValue(['email', 'e-mail', 'email address']),
            phone: getValue(['phone', 'telephone', 'tel', 'phone number', 'phonenumber']),
            city: getValue(['city']),
            state: getValue(['state', 'province']),
            zip: getValue(['zip', 'zipcode', 'postal code', 'postalcode', 'postcode']),
            country: getValue(['country']),
            address: getValue(['address', 'street', 'street address']),
            buyingGroup: getValue(['buyinggroup', 'buying group', 'group']),
            status: getValue(['status']) || 'Prospect'
          };
        }).filter(row => row.companyName); // Filter out rows without company name

        setParsedData(normalizedData);
        checkDuplicates(normalizedData);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const checkDuplicates = async (data: DealerRow[]) => {
    try {
      setError('');
      const response = await api.post('/dealers/check-duplicates', { dealers: data });
      setDuplicates(response.data.duplicateList || []);
      setNewDealers(response.data.newList || []);
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check for duplicates');
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
          <h2 className="text-2xl font-bold mb-4">Upload CSV File</h2>
          <p className="text-gray-600 mb-4">
            Upload a CSV file with your dealers. Required column: <strong>Company Name</strong>.
            Optional columns: Contact Name, Email, Phone, City, State, Zip, Country, Address, Buying Group, Status.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="mb-4 w-full"
          />

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
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
            <p className="text-lg">
              Successfully imported <strong>{importResult?.count || 0}</strong> dealers
            </p>
            {importResult?.duplicates > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {importResult.duplicates} duplicates were skipped
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

  return null;
};

export default CSVUpload;

