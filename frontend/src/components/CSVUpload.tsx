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
  groupNames?: string; // Comma-separated group names
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
    try {
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
        handleNonCSVUpload(selectedFile).catch((err) => {
          console.error('Non-CSV upload error:', err);
          setError('Failed to upload file. Please try again.');
          setIsParsing(false);
        });
        return;
      }

      setFile(selectedFile);
      setError('');
      setIsParsing(true);
      setStep('upload'); // Ensure we're on upload step

      // Parse CSV - read file first with comprehensive error handling
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (!text || typeof text !== 'string') {
              throw new Error('Failed to read file content as text');
            }

            Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              complete: (results: ParseResult<any>) => {
                try {
                  // Safely check for errors
                  if (results.errors && Array.isArray(results.errors) && results.errors.length > 0) {
                    const errorMessages = results.errors
                      .map((e: any) => (e && typeof e === 'object' && e.message ? String(e.message) : String(e)))
                      .filter(Boolean)
                      .join(', ');
                    console.error('CSV parsing errors:', errorMessages);
                    setError(`CSV parsing errors: ${errorMessages}`);
                    setIsParsing(false);
                    setStep('upload');
                    return;
                  }

                  // Safely get data
                  const data = results?.data;
                  if (!data || !Array.isArray(data) || data.length === 0) {
                    setError('CSV file appears to be empty or has no data rows. Please check your file.');
                    setIsParsing(false);
                    setStep('upload');
                    return;
                  }

                  // Normalize column names (case-insensitive, handle spaces)
                  const normalizeKey = (key: string) => {
                    if (!key || typeof key !== 'string') return '';
                    return key.toLowerCase().trim().replace(/\s+/g, '');
                  };

                  // Check if this is a groups-only CSV (has group/name column but no company name column)
                  const firstRow = data[0];
                  const rowKeys = firstRow ? Object.keys(firstRow) : [];
                  const hasCompanyName = rowKeys.some(k => {
                    const normalized = normalizeKey(k);
                    return ['companyname', 'company', 'companyname', 'businessname', 'businessname'].includes(normalized);
                  });
                  const hasGroupName = rowKeys.some(k => {
                    const normalized = normalizeKey(k);
                    return ['group', 'name', 'groupname'].includes(normalized);
                  });

                  // If it's groups-only CSV, handle differently
                  if (!hasCompanyName && hasGroupName) {
                    const groupNames = data
                      .map((row: any) => {
                        if (!row || typeof row !== 'object') return null;
                        const getValue = (keys: string[]) => {
                          for (const key of keys) {
                            const found = rowKeys.find(k => normalizeKey(k) === normalizeKey(key));
                            if (found && row[found] != null) {
                              const value = row[found];
                              if (typeof value === 'string') return value.trim();
                              if (typeof value === 'number') return String(value).trim();
                              if (value != null) return String(value).trim();
                            }
                          }
                          return '';
                        };
                        const name = getValue(['group', 'name', 'groupname']) || '';
                        return name ? name : null;
                      })
                      .filter((name): name is string => name !== null && name.trim() !== '');

                    if (groupNames.length === 0) {
                      setError('No valid group names found in CSV. Make sure your CSV has a "Group" or "Name" column with data.');
                      setIsParsing(false);
                      setStep('upload');
                      return;
                    }

                    // Import groups directly (using promise chain since we're in a callback)
                    setIsParsing(true);
                    api.post('/groups/bulk-create', { groups: groupNames })
                      .then((response) => {
                        setImportResult({
                          message: `Successfully created ${response.data.created} groups`,
                          count: response.data.created,
                          skipped: response.data.skipped || 0
                        });
                        setStep('complete');
                        setIsParsing(false);
                      })
                      .catch((err: any) => {
                        console.error('Bulk create groups error:', err);
                        setError(err.response?.data?.error || 'Failed to create groups');
                        setIsParsing(false);
                        setStep('upload');
                      });
                    return;
                  }

                  // Otherwise, process as dealer CSV
                  const normalizedData = data
                    .map((row): DealerRow | null => {
                      try {
                        // Ensure row is an object
                        if (!row || typeof row !== 'object' || Array.isArray(row)) {
                          return null;
                        }
                        
                        const getValueForRow = (keys: string[]) => {
                          if (!row || typeof row !== 'object') return '';
                          const rowKeys = Object.keys(row || {});
                          
                          for (const key of keys) {
                            const found = rowKeys.find(k => {
                              if (!k || typeof k !== 'string') return false;
                              return normalizeKey(k) === normalizeKey(key);
                            });
                            
                            if (found && row[found] != null) {
                              const value = row[found];
                              if (typeof value === 'string') return value.trim();
                              if (typeof value === 'number') return String(value).trim();
                              if (value != null) return String(value).trim();
                            }
                          }
                          return '';
                        };

                        const phoneValue = getValueForRow(['phone', 'telephone', 'tel', 'phone number', 'phonenumber']);
                        const emailValue = getValueForRow(['email', 'e-mail', 'email address']);
                        
                        const companyName = getValueForRow(['companyname', 'company', 'company name', 'business name', 'businessname']) || '';
                        
                        // Only return valid rows with company name
                        if (!companyName || companyName.trim() === '') {
                          return null;
                        }
                        
                        const buyingGroupValue = getValueForRow(['buyinggroup', 'buying group']);
                        const groupNamesValue = getValueForRow(['groups', 'group names', 'groupnames']);
                        
                        return {
                          companyName: companyName.trim(),
                          contactName: getValueForRow(['contactname', 'contact', 'contact name', 'name', 'person']) || undefined,
                          email: emailValue && typeof emailValue === 'string' && emailValue.trim() ? emailValue.toLowerCase().trim() : undefined,
                          phone: phoneValue && typeof phoneValue === 'string' && phoneValue.trim() ? phoneValue.trim() : undefined,
                          city: getValueForRow(['city']) || undefined,
                          state: getValueForRow(['state', 'province']) || undefined,
                          zip: getValueForRow(['zip', 'zipcode', 'postal code', 'postalcode', 'postcode']) || undefined,
                          country: getValueForRow(['country']) || undefined,
                          address: getValueForRow(['address', 'street', 'street address']) || undefined,
                          buyingGroup: buyingGroupValue || undefined,
                          groupNames: groupNamesValue || undefined, // Comma-separated group names
                          status: getValueForRow(['status']) || 'Prospect'
                        };
                      } catch (rowError) {
                        console.error('Error processing row:', rowError, row);
                        return null;
                      }
                    })
                    .filter((row): row is DealerRow => {
                      return row !== null && 
                             row !== undefined && 
                             typeof row === 'object' &&
                             row.companyName != null && 
                             typeof row.companyName === 'string' &&
                             row.companyName.trim() !== '';
                    });

                  if (normalizedData.length === 0) {
                    setError('No valid dealers found in CSV. Make sure your CSV has a "Company Name" column with data, or if uploading groups only, use a "Group" or "Name" column.');
                    setIsParsing(false);
                    setStep('upload');
                    return;
                  }

                  setParsedData(normalizedData);
                  // Keep isParsing true while checking duplicates to show loading state
                  setIsParsing(true);
                  
                  // Call checkDuplicates with proper error handling to prevent blank screen
                  // If checkDuplicates fails, skip it and go straight to review
                  checkDuplicates(normalizedData).catch((err: any) => {
                    console.error('Error in checkDuplicates:', err);
                    // On any error, skip duplicate check and proceed to review
                    // This prevents blank screen and allows user to continue
                    setError('Note: Could not check for duplicates. You can still proceed with import.');
                    setIsParsing(false);
                    setDuplicates([]);
                    setNewDealers(normalizedData);
                    setStep('review');
                  });
                } catch (parseError) {
                  console.error('Error in CSV parse complete handler:', parseError);
                  setError('An error occurred while processing the CSV file. Please try again.');
                  setIsParsing(false);
                  setStep('upload');
                }
              },
              error: (error: Error) => {
                console.error('CSV parse error:', error);
                setIsParsing(false);
                setStep('upload');
                setError(`Failed to parse CSV file: ${error.message || 'Unknown error'}. Please make sure your file is a valid CSV file.`);
              }
            });
          } catch (loadError) {
            console.error('Error in FileReader onload:', loadError);
            setIsParsing(false);
            setStep('upload');
            setError('Failed to process file content. Please try again.');
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          setIsParsing(false);
          setStep('upload');
          setError('Failed to read file. Please try again.');
        };
        
        reader.onabort = () => {
          console.warn('FileReader aborted');
          setIsParsing(false);
          setStep('upload');
          setError('File reading was cancelled. Please try again.');
        };
        
        reader.readAsText(selectedFile);
      } catch (readerError) {
        console.error('Error creating FileReader:', readerError);
        setIsParsing(false);
        setStep('upload');
        setError('Failed to initialize file reader. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      setIsParsing(false);
      setStep('upload');
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const checkDuplicates = async (data: DealerRow[]) => {
    try {
      setError('');
      setIsParsing(true);
      // Ensure we're in a valid state - stay on upload step while checking
      if (step !== 'review' && step !== 'importing' && step !== 'complete') {
        setStep('upload');
      }
      
      if (!data || data.length === 0) {
        setError('No dealers to check. Please ensure your CSV has valid data.');
        setIsParsing(false);
        // Stay on upload step if no data
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
        // Invalid response - skip duplicate check and proceed to review
        console.log('Invalid response from server, proceeding without duplicate check...');
        setError('Note: Could not check for duplicates. You can still proceed with import.');
        setDuplicates([]);
        setNewDealers(data);
        setIsParsing(false);
        setStep('review');
        return;
      }

      const duplicateList = (response.data && Array.isArray(response.data.duplicateList)) ? response.data.duplicateList : [];
      const newList = (response.data && Array.isArray(response.data.newList)) ? response.data.newList : [];

      console.log('Duplicate check complete:', {
        duplicates: duplicateList.length,
        new: newList.length
      });

      setDuplicates(duplicateList);
      setNewDealers(newList);
      setIsParsing(false);
      setStep('review');
    } catch (err: any) {
      console.error('Check duplicates error:', err);
      
      // For ANY error in duplicate check, skip it and proceed to review
      // This prevents blank screen and allows user to continue with import
      console.log('Duplicate check error, proceeding without duplicate check...', err);
      
      let errorMessage = 'Note: Could not check for duplicates. You can still proceed with import.';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // On timeout, skip duplicate check and proceed with import
        console.log('Duplicate check timed out, proceeding without duplicate check...');
        errorMessage = 'Note: Duplicate check timed out. You can still proceed with import.';
      } else if (err.response?.status === 413) {
        // Request too large - skip duplicate check
        console.log('Request too large for duplicate check, proceeding without duplicate check...');
        errorMessage = 'Note: File too large for duplicate check. You can still proceed with import.';
      } else if (err.response?.status === 403) {
        // Subscription issue - still proceed but show warning
        errorMessage = 'Note: Subscription check failed. You can still proceed with import.';
      } else if (err.response?.status === 401) {
        // Auth issue - still proceed but show warning
        errorMessage = 'Note: Authentication check failed. You can still proceed with import.';
      }
      
      // Always proceed to review step - never return to upload or show blank screen
      setError(errorMessage);
      setDuplicates([]);
      // Ensure we always set an array, never undefined
      const safeParsedData = Array.isArray(parsedData) ? parsedData : [];
      const safeData = Array.isArray(data) ? data : [];
      setNewDealers(safeParsedData.length > 0 ? safeParsedData : safeData);
      setIsParsing(false);
      setStep('review');
    }
  };

  const handleImport = async (skipDuplicates: boolean) => {
    try {
      setStep('importing');
      setError('');

      // Defensive: Ensure arrays are always defined
      const safeNewDealers = Array.isArray(newDealers) ? newDealers : [];
      const safeDuplicates = Array.isArray(duplicates) ? duplicates : [];

      // Combine new dealers with selected duplicates (if not skipping)
      const dealersToImport = skipDuplicates
        ? safeNewDealers
        : [
            ...safeNewDealers,
            ...safeDuplicates.filter((_, index) => selectedDuplicates.has(index))
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
      setStep('upload'); // Ensure we're on upload step

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
      setStep('upload'); // Always return to upload step on error
      
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

  // Always show upload step if step is 'upload' OR if step is invalid/undefined
  // This ensures we never render a blank screen
  if (!step || step === 'upload') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Upload File</h2>
          <p className="text-gray-600 mb-4">
            <strong>For CSV files:</strong> Upload a CSV file with your dealers. Required column: <strong>Company Name</strong>.
            Optional columns: Contact Name, Email, Phone, City, State, Zip, Country, Address, Buying Group, Groups (comma-separated), Status.
            <br /><br />
            <strong>Groups-only CSV:</strong> Upload a CSV with just a "Group" or "Name" column to create groups without dealers.
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
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span>Processing file...</span>
              </div>
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
              disabled={isParsing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    // Defensive: Ensure arrays are always defined and are actually arrays
    const safeParsedData = Array.isArray(parsedData) ? parsedData : [];
    const safeNewDealers = Array.isArray(newDealers) ? newDealers : [];
    const safeDuplicates = Array.isArray(duplicates) ? duplicates : [];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
          <h2 className="text-2xl font-bold mb-4">Review Import</h2>
          
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{safeParsedData.length}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{safeNewDealers.length}</div>
              <div className="text-sm text-gray-600">New Dealers</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{safeDuplicates.length}</div>
              <div className="text-sm text-gray-600">Potential Duplicates</div>
            </div>
          </div>

          {safeDuplicates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Potential Duplicates</h3>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {safeDuplicates
                  .map((dup, index) => {
                    // Safely get dealer company name
                    const companyName = dup?.dealer?.companyName;
                    if (!companyName || typeof companyName !== 'string') {
                      // Skip invalid duplicates
                      return null;
                    }
                    
                    return (
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
                          <div className="font-semibold">{companyName}</div>
                          {dup?.existing && (
                            <div className="text-sm text-gray-600">
                              Matches existing: {dup.existing.companyName || 'Unknown'}
                              {dup.existing.email && typeof dup.existing.email === 'string' && ` (${dup.existing.email})`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean)}
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
            {safeDuplicates.length > 0 && (
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
              Import {selectedDuplicates.size > 0 ? `(${safeNewDealers.length + selectedDuplicates.size} dealers)` : `(${safeNewDealers.length} dealers)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    const safeNewDealers = Array.isArray(newDealers) ? newDealers : [];
    const totalDealers = safeNewDealers.length + (selectedDuplicates.size > 0 ? selectedDuplicates.size : 0);
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
            {importResult && typeof importResult.duplicates === 'number' && importResult.duplicates > 0 && (
              <p className="text-sm text-gray-600 mb-1">
                {importResult.duplicates} duplicates were skipped
              </p>
            )}
            {importResult && typeof importResult.errors === 'number' && importResult.errors > 0 && (
              <p className="text-sm text-yellow-600 mb-1">
                {importResult.errors} rows had errors
              </p>
            )}
            {importResult && importResult.duration && typeof importResult.duration === 'string' && (
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

