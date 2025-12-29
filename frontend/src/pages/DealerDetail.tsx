import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useSubscription } from '../contexts/SubscriptionContext';

interface BuyingGroupHistory {
  id: string;
  startDate: string;
  endDate: string | null;
  buyingGroup: {
    id: string;
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
}

interface PrivacyPermission {
  id: string;
  permission: string;
  granted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrivacyPermissionHistory {
  id: string;
  permission: string;
  granted: boolean;
  action: string;
  changedData: any;
  createdAt: string;
}

interface DealerChangeHistory {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  createdAt: string;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  type: string;
  emailSent: boolean;
  emailSentDate: string | null;
  emailContent: string | null;
  followUp: boolean;
  followUpDate: string | null;
}

interface DealerTradeShowAssociation {
  id: string;
  tradeShowId: string;
  associationDate: string;
  notes?: string;
  tradeShow: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
  };
}

interface DealerDetail {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  address: string | null;
  buyingGroup: string | null;
  status: string;
  rating: number | null;
  customFields?: Record<string, any>;
  dealerNotes: Array<{ id: string; content: string; createdAt: string }>;
  photos: Array<{ id: string; originalName: string; type: string; createdAt: string; tradeshowName?: string }>;
  voiceRecordings: Array<{ id: string; originalName: string; createdAt: string; date: string | null; tradeshowName: string | null }>;
  todos: Todo[];
  buyingGroupHistory?: BuyingGroupHistory[];
  products?: Array<{ product: Product }>;
  privacyPermissions?: PrivacyPermission[];
  privacyPermissionHistory?: PrivacyPermissionHistory[];
  changeHistory?: DealerChangeHistory[];
  tradeShows?: DealerTradeShowAssociation[];
}

interface AccordionSection {
  id: string;
  title: string;
  expanded: boolean;
}

const DealerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasActiveSubscription } = useSubscription();
  const [dealer, setDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [showBuyingGroupModal, setShowBuyingGroupModal] = useState(false);
  const [buyingGroups, setBuyingGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBuyingGroupId, setSelectedBuyingGroupId] = useState<string>('');
  const [showCreateBuyingGroup, setShowCreateBuyingGroup] = useState(false);
  const [newBuyingGroupName, setNewBuyingGroupName] = useState('');
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [todoFromRecording, setTodoFromRecording] = useState<{ [recordingId: string]: { title: string; description: string; followUpDate: string } }>({});
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  
  const [recordingDate, setRecordingDate] = useState<string>(getTodayDate);
  const [recordingTradeshowName, setRecordingTradeshowName] = useState<string>('');
  const [tradeShows, setTradeShows] = useState<Array<{ id: string; name: string; startDate?: string; endDate?: string }>>([]);
  const [audioUrls, setAudioUrls] = useState<{ [recordingId: string]: string }>({});
  const [audioLoadingErrors, setAudioLoadingErrors] = useState<{ [recordingId: string]: boolean }>({});
  
  // Tradeshow association state - simple dropdown approach
  const [selectedTradeshowId, setSelectedTradeshowId] = useState('');

  // Email files state
  const [emailFiles, setEmailFiles] = useState<Array<{ id: string; originalName: string; description: string | null }>>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Accordion state - all collapsed by default
  const [sections, setSections] = useState<AccordionSection[]>([
    { id: 'info', title: 'Dealer Information', expanded: false },
    { id: 'products', title: 'Products', expanded: false },
    { id: 'voiceNotes', title: 'Voice Notes', expanded: false },
    { id: 'notes', title: 'Notes', expanded: false },
    { id: 'photos', title: 'Business Cards & Photos', expanded: false },
    { id: 'badges', title: 'Badge Scanning', expanded: false },
    { id: 'todos', title: 'Tasks and To Do\'s', expanded: false },
    { id: 'emails', title: 'Emails', expanded: false },
    { id: 'privacy', title: 'Privacy Permissions', expanded: false },
    { id: 'tradeshows', title: '🎪 Associated Tradeshows', expanded: false },
    { id: 'completedTasks', title: 'Completed Tasks', expanded: false },
    { id: 'changeHistory', title: '📋 Permissions and Change History', expanded: false },
  ]);

  // Auto-save debounce refs
  const autoSaveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  // Form state
  const [dealerInfo, setDealerInfo] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    address: '',
    status: 'Prospect',
  });

  const [noteContent, setNoteContent] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    type: 'general',
    dueDate: '',
    followUp: false,
    followUpDate: '',
  });

  // Privacy permissions
  const [privacyPermissions, setPrivacyPermissions] = useState<{ [key: string]: boolean }>({
    marketing_emails: false,
    data_sharing: false,
    phone_contact: false,
    snail_mail: false,
    badge_photo: false,
    audio_notes: false,
  });

  // Consent permissions (user must obtain from booth visitors)
  const [consentExpanded, setConsentExpanded] = useState(false);
  const [consentPermissions, setConsentPermissions] = useState({
    photos: false,
    badgeScan: false,
    audioRecording: false,
    otherPermission: '',
  });
  const [showConsentConfirmModal, setShowConsentConfirmModal] = useState(false);
  const [highlightMissingPermissions, setHighlightMissingPermissions] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDealer();
      fetchBuyingGroups();
      if (hasActiveSubscription) {
        fetchTradeShows();
        fetchEmailFiles();
      }
    }
  }, [id, hasActiveSubscription]);

  const fetchTradeShows = async () => {
    try {
      const response = await api.get('/trade-shows');
      const shows = response.data.map((ts: any) => ({ 
        id: ts.id, 
        name: ts.name,
        startDate: ts.startDate,
        endDate: ts.endDate
      }));
      setTradeShows(shows);
      
      // Set default to current tradeshow (one that's happening now or most recent)
      const today = new Date();
      const currentShow = shows.find((ts: any) => {
        if (!ts.startDate) return false;
        const start = new Date(ts.startDate);
        const end = ts.endDate ? new Date(ts.endDate) : start;
        return today >= start && today <= end;
      });
      
      if (currentShow) {
        setSelectedTradeshowId(currentShow.id);
      } else if (shows.length > 0) {
        // If no current show, select the most recent one
        setSelectedTradeshowId(shows[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch trade shows:', error);
    }
  };

  const fetchEmailFiles = async () => {
    try {
      const response = await api.get('/email-files');
      setEmailFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch email files:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!dealer?.email) {
      alert('This dealer does not have an email address.');
      return;
    }

    if (!emailSubject.trim()) {
      alert('Please enter an email subject.');
      return;
    }

    try {
      setSendingEmail(true);
      
      // Comprehensive logging before sending
      console.log('[Email] ===== SENDING EMAIL =====');
      console.log('[Email] Dealer email:', dealer.email);
      console.log('[Email] Selected file IDs:', selectedFileIds);
      console.log('[Email] Selected file IDs type:', typeof selectedFileIds);
      console.log('[Email] Selected file IDs is array:', Array.isArray(selectedFileIds));
      console.log('[Email] Selected file IDs length:', selectedFileIds?.length || 0);
      console.log('[Email] Email subject:', emailSubject);
      console.log('[Email] Email body length:', emailBody?.length || 0);
      console.log('[Email] Email CC:', emailCc);
      
      // NEW APPROACH: Send fileIds directly - backend will read files from disk
      // This avoids the 404 download issue completely
      // Verify selectedFileIds is an array and filter out any invalid values
      const fileIdsToSend = Array.isArray(selectedFileIds) 
        ? selectedFileIds.filter(id => id && typeof id === 'string' && id.trim().length > 0)
        : [];
      
      console.log('[Email] Selected file IDs:', fileIdsToSend);
      console.log('[Email] Sending fileIds directly to backend (no download step)');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:300',message:'Preparing to send email with fileIds',data:{fileIdsCount:fileIdsToSend.length,fileIds:fileIdsToSend,to:dealer.email,subject:emailSubject},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'FILEID_FRONTEND_1'})}).catch(()=>{});
      // #endregion
      
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // Send JSON with fileIds - backend will read files directly
      const emailResponse = await fetch(`${API_URL}/email-files/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: dealer.email,
          cc: emailCc || undefined,
          subject: emailSubject,
          body: emailBody || undefined,
          fileIds: fileIdsToSend.length > 0 ? fileIdsToSend : undefined
        })
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:330',message:'Email request sent',data:{status:emailResponse.status,statusText:emailResponse.statusText,ok:emailResponse.ok,fileIdsSent:fileIdsToSend.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'FILEID_FRONTEND_2'})}).catch(()=>{});
      // #endregion
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:390',message:'FormData request sent',data:{status:emailResponse.status,statusText:emailResponse.statusText,ok:emailResponse.ok,contentType:emailResponse.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'FORMDATA_K'})}).catch(()=>{});
      // #endregion

      if (!emailResponse.ok) {
        let errorData;
        try {
          errorData = await emailResponse.json();
        } catch {
          errorData = { error: 'Unknown error' };
        }
        throw new Error(errorData.error || `HTTP ${emailResponse.status}`);
      }

      const emailData = await emailResponse.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:396',message:'API response received',data:{success:emailData.success,responseData:emailData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      console.log('[Email] Email send response:', emailData);

      if (!emailData.success) {
        throw new Error(emailData.error || 'Email send failed');
      }

      // Check attachment status from response
      const attachmentsRequested = fileIdsToSend.length; // Number of file IDs sent
      const attachmentsSent = emailData.attachmentsSent || 0;
      
      if (attachmentsRequested > 0 && attachmentsSent === 0) {
        console.error(`[Email] ERROR: ${attachmentsRequested} attachment(s) were requested but 0 were sent!`);
        console.error(`[Email] This likely means files exist in database but not on disk, or paths are incorrect`);
        alert(`⚠️ Email sent, but ${attachmentsRequested} attachment(s) could not be attached. Files may be missing from server.`);
      } else if (attachmentsRequested > 0 && attachmentsSent < attachmentsRequested) {
        console.warn(`[Email] WARNING: ${attachmentsRequested} attachment(s) requested but only ${attachmentsSent} were sent`);
        alert(`⚠️ Email sent with ${attachmentsSent} of ${attachmentsRequested} attachment(s). Some files may be missing.`);
      } else if (attachmentsSent > 0) {
        console.log(`[Email] ✓ Successfully sent email with ${attachmentsSent} attachment(s)`);
      }

      // Create a todo for this email
      try {
        await api.post('/todos', {
          title: `Email sent: ${emailSubject}`,
          description: emailBody || undefined,
          dealerId: id,
          type: 'email',
          emailSent: true,
          emailSentDate: new Date().toISOString(),
          emailContent: `Sent to ${dealer.email}${emailCc ? `, CC: ${emailCc}` : ''}${attachmentsSent > 0 ? ` with ${attachmentsSent} attachment(s)` : attachmentsRequested > 0 ? ` (${attachmentsRequested} attachment(s) requested but not sent)` : ''}`
        });
      } catch (todoError) {
        console.warn('[Email] Failed to create todo for email, but email was sent:', todoError);
      }

      // Reset form
      setEmailSubject('');
      setEmailBody('');
      setEmailCc('');
      setSelectedFileIds([]);
      
      fetchDealer();
      
      // Show appropriate success message
      if (attachmentsRequested > 0 && attachmentsSent === 0) {
        alert(`Email sent to ${dealer.email}${emailCc ? ` and ${emailCc}` : ''}, but attachments could not be attached. Please check server logs.`);
      } else {
        alert(`Email sent successfully to ${dealer.email}${emailCc ? ` and ${emailCc}` : ''}${attachmentsSent > 0 ? ` with ${attachmentsSent} attachment(s)` : ''}!`);
      }
    } catch (error: any) {
      console.error('[Email] Failed to send email:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send email. Please check your email configuration.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Load audio URLs for recordings
  useEffect(() => {
    if (!dealer?.voiceRecordings || dealer.voiceRecordings.length === 0) {
      setAudioUrls({});
      setAudioLoadingErrors({});
      return;
    }

    const loadAudioUrls = async () => {
      const urls: { [key: string]: string } = {};
      const errors: { [key: string]: boolean } = {};
      
      for (const recording of dealer.voiceRecordings) {
        try {
          const response = await api.get(`/uploads/recording/${recording.id}`, {
            responseType: 'blob',
            timeout: 30000 // 30 second timeout for larger files
          });
          
          if (response.data && response.data.size > 0) {
            // Get MIME type from response headers first, then from blob, then use default
            const contentType = response.headers['content-type'] || 
                               response.data.type || 
                               'audio/webm';
            
            // Ensure we have a valid audio MIME type
            const mimeType = contentType.startsWith('audio/') 
              ? contentType 
              : 'audio/webm';
            
            const blob = new Blob([response.data], { type: mimeType });
            urls[recording.id] = URL.createObjectURL(blob);
            console.log(`Successfully loaded audio for recording ${recording.id}, size: ${blob.size}, type: ${mimeType}`);
          } else {
            console.error(`Empty audio blob for recording ${recording.id}`);
            errors[recording.id] = true;
          }
        } catch (error: any) {
          console.error(`Failed to load audio for recording ${recording.id}:`, {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          errors[recording.id] = true;
        }
      }
      
      setAudioUrls(prev => {
        // Cleanup old URLs
        Object.values(prev).forEach(url => URL.revokeObjectURL(url));
        return urls;
      });
      setAudioLoadingErrors(errors);
    };
    
    loadAudioUrls();

    // Cleanup blob URLs on unmount or when recordings change
    return () => {
      setAudioUrls(prev => {
        Object.values(prev).forEach(url => URL.revokeObjectURL(url));
        return {};
      });
    };
  }, [dealer?.voiceRecordings?.map(r => r.id).join(',')]); // Depend on recording IDs

  const fetchDealer = async () => {
    if (!id) return;
    
    const trimmedId = id.trim();
    if (!trimmedId || !trimmedId.match(/^c[a-z0-9]{24}$/i)) {
      alert('Invalid dealer ID');
      navigate('/dealers');
      return;
    }
    
    try {
      const response = await api.get(`/dealers/${trimmedId}`);
      const dealerData = response.data;
      
      setDealer(dealerData);
      setRating(dealerData.rating || 0);
      
      // Set dealer info for editing
      setDealerInfo({
        companyName: dealerData.companyName || '',
        contactName: dealerData.contactName || '',
        email: dealerData.email || '',
        phone: dealerData.phone || '',
        city: dealerData.city || '',
        state: dealerData.state || '',
        zip: dealerData.zip || '',
        country: dealerData.country || '',
        address: dealerData.address || '',
        status: dealerData.status || 'Prospect',
      });

      // Set privacy permissions
      if (dealerData.privacyPermissions) {
        const perms: { [key: string]: boolean } = {};
        dealerData.privacyPermissions.forEach((p: PrivacyPermission) => {
          perms[p.permission] = p.granted;
        });
        setPrivacyPermissions(prev => ({ ...prev, ...perms }));
        
        // Set consent permissions from privacy permissions
        setConsentPermissions({
          photos: perms['consent_photos'] || false,
          badgeScan: perms['consent_badge_scan'] || false,
          audioRecording: perms['consent_audio_recording'] || false,
          otherPermission: (dealerData.customFields as any)?.otherConsentPermission || '',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch dealer:', error);
      if (error.response?.status === 404) {
        alert('Dealer not found');
        navigate('/dealers');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyingGroups = async () => {
    try {
      const response = await api.get('/buying-groups');
      setBuyingGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch buying groups:', error);
    }
  };

  // Auto-save function with 2 second debounce
  const autoSave = useCallback((field: string, _value: any, saveFn: () => Promise<void>) => {
    // Clear existing timer
    if (autoSaveTimers.current[field]) {
      clearTimeout(autoSaveTimers.current[field]);
    }

    // Set saving state
    setSaving(prev => ({ ...prev, [field]: true }));

    // Set new timer
    autoSaveTimers.current[field] = setTimeout(async () => {
      try {
        await saveFn();
      } catch (error) {
        console.error(`Auto-save failed for ${field}:`, error);
      } finally {
        setSaving(prev => ({ ...prev, [field]: false }));
      }
    }, 2000);
  }, []);

  const handleDealerInfoChange = (field: string, value: string) => {
    setDealerInfo(prev => ({ ...prev, [field]: value }));
    
    autoSave(`dealer_${field}`, value, async () => {
      await api.put(`/dealers/${id}`, { [field]: value });
    });
  };

  // Handle consent permission changes
  const handleConsentChange = async (field: string, value: boolean | string) => {
    const newConsent = { ...consentPermissions, [field]: value };
    setConsentPermissions(newConsent);
    
    // Save to dealer's privacy permissions
    try {
      const permissionKey = field === 'photos' ? 'consent_photos' 
        : field === 'badgeScan' ? 'consent_badge_scan'
        : field === 'audioRecording' ? 'consent_audio_recording'
        : 'consent_other';
      
      if (field === 'otherPermission') {
        // Save as custom field or note
        await api.put(`/dealers/${id}`, { 
          customFields: { ...dealer?.customFields as object, otherConsentPermission: value }
        });
      } else {
        await api.put(`/dealers/${id}/privacy/${permissionKey}`, { 
          granted: value as boolean 
        });
      }
    } catch (error) {
      console.error('Failed to save consent permission:', error);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    try {
      await api.put(`/dealers/${id}/rating`, { rating: newRating });
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
  };

  // Handle consent accordion toggle with confirmation
  const handleConsentAccordionToggle = () => {
    if (consentExpanded) {
      // User is trying to close - show confirmation
      setShowConsentConfirmModal(true);
    } else {
      // User is opening - just expand
      setConsentExpanded(true);
      setHighlightMissingPermissions(false);
    }
  };

  // Get unchecked consent permissions
  const getUncheckedConsentPermissions = () => {
    const unchecked: string[] = [];
    if (!consentPermissions.photos) unchecked.push('Photos Permission');
    if (!consentPermissions.badgeScan) unchecked.push('Badge Scan Permission');
    if (!consentPermissions.audioRecording) unchecked.push('Audio Recording Permission');
    return unchecked;
  };

  // Handle confirmation modal response
  const handleConsentConfirmYes = async () => {
    if (!id) return;

    // Avoid creating duplicate "consent_finalized" entries:
    // only allow one finalized consent record per dealer.
    const alreadyFinalized =
      dealer?.privacyPermissionHistory?.some(
        (h) => h.permission === 'consent_finalized'
      ) || false;

    if (alreadyFinalized) {
      setShowConsentConfirmModal(false);
      setConsentExpanded(false);
      setHighlightMissingPermissions(false);
      return;
    }

    // Record that permissions were finalized
    const permissions = [
      { key: 'photos', granted: consentPermissions.photos },
      { key: 'badgeScan', granted: consentPermissions.badgeScan },
      { key: 'audioRecording', granted: consentPermissions.audioRecording },
    ];
    
    // Log a "permissions_finalized" event to history
    try {
      await api.put(`/dealers/${id}/privacy-permissions`, {
        permission: 'consent_finalized',
        granted: true,
        action: 'finalized',
        changedData: {
          text: `Consent permissions finalized: ${consentPermissions.photos ? 'Photos permission granted' : 'Photos permission not obtained'}, ${consentPermissions.badgeScan ? 'Badge scan permission granted' : 'Badge scan permission not obtained'}, ${consentPermissions.audioRecording ? 'Audio recording permission granted' : 'Audio recording permission not obtained'}`,
          permissions: permissions,
        }
      });
      fetchDealer(); // Refresh to get updated history
    } catch (error) {
      console.error('Failed to log consent finalization:', error);
    }
    
    setShowConsentConfirmModal(false);
    setConsentExpanded(false);
    setHighlightMissingPermissions(false);
  };

  const handleConsentConfirmNo = () => {
    // Show which permissions are missing
    setShowConsentConfirmModal(false);
    setHighlightMissingPermissions(true);
  };

  const handleFinishedPermissions = async () => {
    // User clicked "I'm finished getting permissions" button
    await handleConsentConfirmYes();
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;

    try {
      await api.post(`/dealers/${id}/notes`, { content: noteContent });
      setNoteContent('');
      fetchDealer();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/dealers/${id}/notes/${noteId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handlePhotoUpload = async (file: File, type: string = 'business_card') => {
    if (!id) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);

    try {
      await api.post(`/uploads/photo/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.delete(`/uploads/photo/${photoId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!id || !hasActiveSubscription) {
      alert('Active subscription required to record voice notes');
      return;
    }

    // Always set date to today's date when starting a new recording
    setRecordingDate(getTodayDate());

    // Clean up any existing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping previous recorder:', e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear previous chunks
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1 // Explicitly set to mono for better compatibility
        }
      });
      
      // Verify stream is active
      if (!stream || stream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks available in stream');
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack.readyState !== 'live') {
        throw new Error('Audio track is not live');
      }
      
      streamRef.current = stream;
      
      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined') {
        alert('MediaRecorder is not supported in this browser');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Determine the best MIME type for the browser
      let mimeType = 'audio/webm';
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      console.log('Using MIME type:', mimeType, 'Supported:', MediaRecorder.isTypeSupported(mimeType));

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      let hasReceivedData = false;

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', {
          size: event.data.size,
          type: event.data.type,
          state: mediaRecorder.state
        });
        
        // Only add non-empty blobs
        if (event.data && event.data.size > 0) {
          hasReceivedData = true;
          audioChunksRef.current.push(event.data);
          console.log('Added chunk:', event.data.size, 'bytes. Total chunks:', audioChunksRef.current.length);
        } else {
          console.warn('Received empty blob, ignoring');
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped. State:', mediaRecorder.state);
        console.log('Total chunks collected:', audioChunksRef.current.length);
        
        const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('Total size:', totalSize, 'bytes');
        
        // Stop all tracks first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Wait a bit for any final data to arrive
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (audioChunksRef.current.length > 0 && totalSize > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Created final blob:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: audioChunksRef.current.length
          });
          
          // Verify blob is valid
          if (audioBlob.size > 0) {
            await handleUploadRecording(audioBlob, mimeType);
          } else {
            console.error('Blob is empty after combining chunks');
            alert('No audio data recorded. Please try again.');
          }
        } else {
          console.error('No valid audio data collected:', {
            chunks: audioChunksRef.current.length,
            totalSize,
            hasReceivedData
          });
          alert('No audio data recorded. Please check your microphone and try again.');
        }
      };

      // Start recording with timeslice to ensure data is collected regularly
      try {
        // Use a timeslice of 1000ms (1 second) for more reliable data collection
        mediaRecorder.start(1000);
        console.log('Recording started successfully:', {
          mimeType,
          state: mediaRecorder.state,
          streamActive: stream.active,
          trackState: audioTrack.readyState
        });
        
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (startError: any) {
        console.error('Failed to start MediaRecorder:', startError);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        alert(`Failed to start recording: ${startError.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Failed to access microphone: ${error.message || 'Please check permissions and try again.'}`);
      }
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Request any remaining data before stopping
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('Requesting final data before stopping...');
          mediaRecorderRef.current.requestData();
          
          // Wait a bit for the data to be available, then stop
          setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              console.log('Stopping recorder, state:', mediaRecorderRef.current.state);
              mediaRecorderRef.current.stop();
            }
          }, 300);
        } else if (mediaRecorderRef.current.state === 'paused') {
          // If paused, resume then stop to ensure we get all data
          mediaRecorderRef.current.resume();
          mediaRecorderRef.current.requestData();
          setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
          }, 300);
        } else {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        // Force stop if there's an error
        try {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          console.error('Error force stopping:', e);
        }
      }
      
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const handleUploadRecording = async (audioBlob: Blob, mimeType: string) => {
    if (!id) return;

    setIsUploading(true);

    // Determine file extension based on mime type
    let extension = '.webm';
    if (mimeType.includes('mp4')) extension = '.m4a';
    else if (mimeType.includes('ogg')) extension = '.ogg';
    else if (mimeType.includes('wav')) extension = '.wav';

    const formData = new FormData();
    const audioFile = new File([audioBlob], `recording-${Date.now()}${extension}`, { type: mimeType });
    formData.append('recording', audioFile);
    formData.append('duration', Math.floor(audioBlob.size / 1000).toString()); // Approximate duration
    if (recordingDate) {
      formData.append('date', recordingDate);
    }
    if (recordingTradeshowName) {
      formData.append('tradeshowName', recordingTradeshowName);
    }

    try {
      console.log('Uploading recording:', {
        filename: audioFile.name,
        size: audioBlob.size,
        type: mimeType,
        date: recordingDate
      });
      
      await api.post(`/uploads/recording/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Recording uploaded successfully');
      
      // Reset form fields - always set date to today's date
      setRecordingDate(getTodayDate());
      setRecordingTradeshowName('');
      await fetchDealer();
    } catch (error: any) {
      console.error('Failed to upload recording:', error);
      alert(error.response?.data?.error || 'Failed to upload recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm('Delete this voice recording?')) return;
    try {
      await api.delete(`/uploads/recording/${recordingId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  const handleCreateTodoFromRecording = async (recordingId: string) => {
    if (!id) return;
    const todo = todoFromRecording[recordingId];
    if (!todo || !todo.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      // Ensure follow-up date is properly formatted or null
      const followUpDateValue = todo.followUpDate && todo.followUpDate.trim() 
        ? todo.followUpDate.trim() 
        : null;
      const hasFollowUp = !!followUpDateValue;

      await api.post('/todos', {
        title: todo.title,
        description: todo.description || '',
        type: 'general',
        dealerId: id,
        dueDate: null,
        followUp: hasFollowUp,
        followUpDate: followUpDateValue,
      });
      // Clear the todo input for this recording
      setTodoFromRecording(prev => {
        const updated = { ...prev };
        delete updated[recordingId];
        return updated;
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to create todo:', error);
      alert('Failed to create task');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !id) return;

    try {
      await api.post(`/dealers/${id}/products`, { productName: newProductName.trim() });
      setNewProductName('');
      fetchDealer();
    } catch (error: any) {
      console.error('Failed to add product:', error);
      alert(error.response?.data?.error || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Remove this product?')) return;
    try {
      await api.delete(`/dealers/${id}/products/${productId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to remove product:', error);
    }
  };

  const handleAssociateTradeshow = async () => {
    if (!selectedTradeshowId || !id) return;

    try {
      // NOTE: Backend route is mounted at /trade-shows, not /tradeshows
      await api.post(`/trade-shows/${selectedTradeshowId}/dealers/${id}`, {
        associationDate: new Date().toISOString()
      });
      
      fetchDealer();
      alert('Dealer associated with tradeshow successfully!');
    } catch (error: any) {
      console.error('Failed to associate tradeshow:', error);
      const apiError = error.response?.data;
      if (apiError?.error === 'Dealer already associated with this trade show') {
        alert('This dealer is already associated with this tradeshow.');
      } else if (typeof apiError?.error === 'string') {
        // Show backend error plus any detailed message to help us debug production issues
        const details =
          typeof apiError.details === 'string'
            ? `\n\nDetails: ${apiError.details}`
            : '';
        alert(`${apiError.error}${details}`);
      } else {
        alert('Failed to associate tradeshow');
      }
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim() || !id) return;

    try {
      await api.post('/todos', {
        ...newTodo,
        dealerId: id,
        dueDate: newTodo.dueDate || null,
        followUpDate: newTodo.followUpDate || null,
      });
      setNewTodo({
        title: '',
        description: '',
        type: 'general',
        dueDate: '',
        followUp: false,
        followUpDate: '',
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('Failed to add task');
    }
  };

  const handleUpdateTodo = async (todoId: string, updates: Partial<Todo>) => {
    try {
      await api.put(`/todos/${todoId}`, updates);
      fetchDealer();
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/todos/${todoId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handlePrivacyPermissionChange = async (permission: string, granted: boolean) => {
    if (!id) return;

    setPrivacyPermissions(prev => ({ ...prev, [permission]: granted }));

    try {
      await api.put(`/dealers/${id}/privacy-permissions`, {
        permission,
        granted,
        action: granted ? 'granted' : 'revoked'
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to update privacy permission:', error);
    }
  };

  const handleAssignBuyingGroup = async () => {
    if (!id || !selectedBuyingGroupId) return;

    try {
      await api.post(`/buying-groups/${selectedBuyingGroupId}/assign`, { dealerId: id });
      setShowBuyingGroupModal(false);
      setSelectedBuyingGroupId('');
      setShowCreateBuyingGroup(false);
      setNewBuyingGroupName('');
      fetchDealer();
      fetchBuyingGroups(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to assign buying group:', error);
      alert(error.response?.data?.error || 'Failed to assign buying group');
    }
  };

  const handleCreateBuyingGroup = async () => {
    if (!newBuyingGroupName.trim()) {
      alert('Please enter a buying group name');
      return;
    }

    try {
      const response = await api.post('/buying-groups', { name: newBuyingGroupName.trim() });
      // Add the new buying group to the list
      setBuyingGroups([...buyingGroups, response.data]);
      // Automatically select the newly created buying group
      setSelectedBuyingGroupId(response.data.id);
      setShowCreateBuyingGroup(false);
      setNewBuyingGroupName('');
    } catch (error: any) {
      console.error('Failed to create buying group:', error);
      alert(error.response?.data?.error || 'Failed to create buying group');
    }
  };

  const handleRemoveBuyingGroup = async () => {
    if (!id || !dealer || !dealer.buyingGroup) return;

    const buyingGroupName = dealer.buyingGroup;
    const buyingGroupHistory = dealer.buyingGroupHistory;

    // Find the current buying group ID
    const currentHistory = buyingGroupHistory?.find(
      h => h.buyingGroup.name === buyingGroupName && !h.endDate
    );

    if (!currentHistory) {
      alert('Could not find current buying group assignment');
      return;
    }

    if (!confirm(`Remove this dealer from "${buyingGroupName}"? This will be recorded in history.`)) {
      return;
    }

    try {
      await api.delete(`/buying-groups/${currentHistory.buyingGroup.id}/assign/${id}`);
      setShowBuyingGroupModal(false);
      fetchDealer();
    } catch (error: any) {
      console.error('Failed to remove buying group:', error);
      alert(error.response?.data?.error || 'Failed to remove buying group');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!dealer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Dealer not found</p>
          <button
            onClick={() => navigate('/dealers')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Dealers
          </button>
        </div>
      </Layout>
    );
  }

  const AccordionSection = ({ section }: { section: AccordionSection }) => {
    const isExpanded = sections.find(s => s.id === section.id)?.expanded || false;
    
    return (
      <button
        onClick={() => toggleSection(section.id)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base text-left">{section.title}</span>
        <span className={`transform transition-transform ml-2 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
    );
  };

  return (
    <Layout>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate('/dealers')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                ← Back
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{dealer.companyName}</h1>
                {dealer.contactName && (
                  <p className="text-sm sm:text-base text-gray-600 break-words">{dealer.contactName}</p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
              {/* Rating */}
              <div className="flex gap-0.5 sm:gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="text-lg sm:text-2xl focus:outline-none"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              
              {/* Status Badge */}
              <span
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full whitespace-nowrap ${
                  dealer.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : dealer.status === 'Prospect'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {dealer.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Consent Permissions Accordion - Immediately under dealer name/rating */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
          <button
            onClick={handleConsentAccordionToggle}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center text-left hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-base sm:text-lg flex-shrink-0">⚠️</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">Booth Visitor Consent Permissions</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded whitespace-nowrap">Required</span>
              {(consentPermissions.photos || consentPermissions.badgeScan || consentPermissions.audioRecording) && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded whitespace-nowrap">
                  ✓ {[consentPermissions.photos, consentPermissions.badgeScan, consentPermissions.audioRecording].filter(Boolean).length}/3 set
                </span>
              )}
            </div>
            <span className="text-gray-500 text-base sm:text-lg ml-2 flex-shrink-0">{consentExpanded ? '▼' : '▶'}</span>
          </button>
          
          {consentExpanded && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-yellow-200">
              <p className="text-xs sm:text-sm text-gray-700 mt-3 mb-4 bg-white p-2 sm:p-3 rounded border-l-4 border-red-500">
                <strong>You are solely responsible</strong> for obtaining permission from this dealer/customer before capturing their information. 
                Check each box below to confirm you have received their consent.
              </p>
              
              {/* Warning for missing permissions */}
              {highlightMissingPermissions && getUncheckedConsentPermissions().length > 0 && (
                <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-orange-800 font-semibold mb-2">⚠️ Finish getting permissions:</p>
                  <ul className="text-sm text-orange-700 list-disc list-inside">
                    {getUncheckedConsentPermissions().map(perm => (
                      <li key={perm}>{perm} - not yet obtained</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${
                  highlightMissingPermissions && !consentPermissions.photos 
                    ? 'bg-orange-50 border-orange-400 border-2' 
                    : 'bg-white border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={consentPermissions.photos}
                    onChange={(e) => {
                      handleConsentChange('photos', e.target.checked);
                      setHighlightMissingPermissions(false);
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">📸 Photos Permission</span>
                    <p className="text-sm text-gray-600">I have permission to take photos of this person or their materials</p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${
                  highlightMissingPermissions && !consentPermissions.badgeScan 
                    ? 'bg-orange-50 border-orange-400 border-2' 
                    : 'bg-white border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={consentPermissions.badgeScan}
                    onChange={(e) => {
                      handleConsentChange('badgeScan', e.target.checked);
                      setHighlightMissingPermissions(false);
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">🎫 Badge Scan Permission</span>
                    <p className="text-sm text-gray-600">I have permission to photograph or scan their event badge</p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${
                  highlightMissingPermissions && !consentPermissions.audioRecording 
                    ? 'bg-orange-50 border-orange-400 border-2' 
                    : 'bg-white border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={consentPermissions.audioRecording}
                    onChange={(e) => {
                      handleConsentChange('audioRecording', e.target.checked);
                      setHighlightMissingPermissions(false);
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">🎙️ Audio Recording Permission</span>
                    <p className="text-sm text-gray-600">I have permission to record audio notes about our conversation</p>
                  </div>
                </label>
                
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <label className="block">
                    <span className="font-medium text-gray-900">📝 Other Permissions</span>
                    <p className="text-sm text-gray-600 mb-2">Note any additional permissions obtained</p>
                    <input
                      type="text"
                      value={consentPermissions.otherPermission}
                      onChange={(e) => handleConsentChange('otherPermission', e.target.value)}
                      placeholder="e.g., Permission to share contact info with partner company..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </label>
                </div>
              </div>
              
              {/* I'm finished button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleFinishedPermissions}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>✓</span> I'm Finished Getting Permissions
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                See our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
                <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a> for more information.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Consent Confirmation Modal */}
      {showConsentConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ✓ Are you done setting consent permissions?
            </h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Current permissions:</p>
              <ul className="text-sm space-y-1">
                <li className={consentPermissions.photos ? 'text-green-600' : 'text-red-600'}>
                  {consentPermissions.photos ? '✓' : '✗'} Photos Permission
                </li>
                <li className={consentPermissions.badgeScan ? 'text-green-600' : 'text-red-600'}>
                  {consentPermissions.badgeScan ? '✓' : '✗'} Badge Scan Permission
                </li>
                <li className={consentPermissions.audioRecording ? 'text-green-600' : 'text-red-600'}>
                  {consentPermissions.audioRecording ? '✓' : '✗'} Audio Recording Permission
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleConsentConfirmYes}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Yes, I'm Done
              </button>
              <button
                onClick={handleConsentConfirmNo}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
              >
                No, Not Yet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {/* Dealer Information Section */}
        <div className="mb-4">
          <AccordionSection section={sections[0]} />
          {sections[0].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={dealerInfo.companyName}
                    onChange={(e) => handleDealerInfoChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {saving['dealer_companyName'] && <span className="text-xs text-gray-500">Saving...</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={dealerInfo.contactName}
                    onChange={(e) => handleDealerInfoChange('contactName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={dealerInfo.email}
                    onChange={(e) => handleDealerInfoChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={dealerInfo.phone}
                    onChange={(e) => handleDealerInfoChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={dealerInfo.address}
                    onChange={(e) => handleDealerInfoChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={dealerInfo.city}
                    onChange={(e) => handleDealerInfoChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={dealerInfo.state}
                    onChange={(e) => handleDealerInfoChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input
                    type="text"
                    value={dealerInfo.zip}
                    onChange={(e) => handleDealerInfoChange('zip', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={dealerInfo.country}
                    onChange={(e) => handleDealerInfoChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={dealerInfo.status}
                    onChange={(e) => handleDealerInfoChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buying Group</label>
                  <div className="flex items-center gap-2">
                    {dealer.buyingGroup ? (
                      <span className="text-gray-900">{dealer.buyingGroup}</span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                    <button
                      onClick={() => setShowBuyingGroupModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {dealer.buyingGroup ? 'Change' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="mb-4">
          <AccordionSection section={sections[1]} />
          {sections[1].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Enter product name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                />
                <button
                  onClick={handleAddProduct}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
              <div className="space-y-2">
                {dealer.products && dealer.products.length > 0 ? (
                  dealer.products.map((dp) => (
                    <div key={dp.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{dp.product.name}</span>
                      <button
                        onClick={() => handleDeleteProduct(dp.product.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No products added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Voice Notes Section */}
        <div className="mb-4">
          <AccordionSection section={sections[2]} />
          {sections[2].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              {!hasActiveSubscription ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">Active subscription required to record voice notes.</p>
                </div>
              ) : (
                <>
                  {/* Recording Controls */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-lg font-semibold text-blue-600">Uploading recording...</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    ) : !isRecording ? (
                      <div className="flex flex-col items-center gap-4 w-full">
                        {/* Date and Tradeshow Name Inputs */}
                        <div className="w-full space-y-3">
                          {hasActiveSubscription ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                              <input
                                type="date"
                                value={recordingDate}
                                onChange={(e) => setRecordingDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                              <input
                                type="date"
                                value={recordingDate}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                title="Active subscription required to change date"
                              />
                              <p className="text-xs text-gray-500 mt-1">Date set to today (subscription required to change)</p>
                            </div>
                          )}
                          {hasActiveSubscription ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tradeshow Name</label>
                              <select
                                value={recordingTradeshowName}
                                onChange={(e) => setRecordingTradeshowName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">-- Select a tradeshow --</option>
                                {tradeShows.map((ts) => (
                                  <option key={ts.id} value={ts.name}>
                                    {ts.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tradeshow Name</label>
                              <select
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                title="Active subscription required"
                              >
                                <option value="">Active subscription required</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">Active subscription required to select tradeshow</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleStartRecording}
                          className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
                        >
                          <span className="text-2xl">🎤</span>
                          <span className="font-semibold">Tap to Record</span>
                        </button>
                        <p className="text-sm text-gray-500">Tap to record</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 w-full">
                        {/* Visual Recording Bar */}
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                              <span className="text-lg font-semibold text-gray-900">
                                Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                          {/* Animated recording bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-red-600 h-3 rounded-full animate-pulse"
                              style={{ 
                                width: '100%',
                                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">Voice recording in progress...</p>
                        </div>
                        <button
                          onClick={handleStopRecording}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Stop Recording
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recorded Voice Notes */}
                  <div className="space-y-4">
                    {dealer.voiceRecordings && dealer.voiceRecordings.length > 0 ? (
                      dealer.voiceRecordings.map((recording) => (
                        <div key={recording.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎙️</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{recording.originalName}</p>
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs text-gray-500">Recorded: {formatDate(recording.createdAt)}</p>
                                  {recording.date && (
                                    <p className="text-xs text-blue-600">Date: {new Date(recording.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                  )}
                                  {recording.tradeshowName && (
                                    <p className="text-xs text-blue-600">Tradeshow: {recording.tradeshowName}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteRecording(recording.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          
                          {/* Audio Player */}
                          {audioLoadingErrors[recording.id] ? (
                            <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 rounded text-center">
                              <p className="text-red-600 text-sm font-medium">Failed to load audio</p>
                              <p className="text-red-500 text-xs mt-1">The recording file may be corrupted or missing</p>
                            </div>
                          ) : audioUrls[recording.id] ? (
                            <audio controls className="w-full mb-3" src={audioUrls[recording.id]}>
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <div className="w-full mb-3 p-2 bg-gray-100 rounded text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-500 text-sm">Loading audio...</span>
                              </div>
                            </div>
                          )}

                          {/* Todo Creation Section */}
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Create a task from this voice note:</p>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={todoFromRecording[recording.id]?.title || ''}
                                onChange={(e) => setTodoFromRecording(prev => ({
                                  ...prev,
                                  [recording.id]: {
                                    ...prev[recording.id],
                                    title: e.target.value,
                                    description: prev[recording.id]?.description || '',
                                    followUpDate: prev[recording.id]?.followUpDate || ''
                                  }
                                }))}
                                placeholder="Task title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              <textarea
                                value={todoFromRecording[recording.id]?.description || ''}
                                onChange={(e) => setTodoFromRecording(prev => ({
                                  ...prev,
                                  [recording.id]: {
                                    ...prev[recording.id],
                                    title: prev[recording.id]?.title || '',
                                    description: e.target.value,
                                    followUpDate: prev[recording.id]?.followUpDate || ''
                                  }
                                }))}
                                placeholder="Task description (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={2}
                              />
                              {hasActiveSubscription && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date (optional)</label>
                                  <input
                                    type="date"
                                    value={todoFromRecording[recording.id]?.followUpDate || ''}
                                    onChange={(e) => setTodoFromRecording(prev => ({
                                      ...prev,
                                      [recording.id]: {
                                        ...prev[recording.id],
                                        title: prev[recording.id]?.title || '',
                                        description: prev[recording.id]?.description || '',
                                        followUpDate: e.target.value
                                      }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              )}
                              <button
                                onClick={() => handleCreateTodoFromRecording(recording.id)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Add to Tasks
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No voice recordings yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="mb-4">
          <AccordionSection section={sections[3]} />
          {sections[3].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Note
                </button>
              </div>
              <div className="space-y-2">
                {dealer.dealerNotes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-900 flex-1">{note.content}</p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Business Cards & Photos Section */}
        <div className="mb-4">
          <AccordionSection section={sections[4]} />
          {sections[4].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Business Card</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, 'business_card_front');
                    }}
                    className="hidden"
                    id="business-card-front"
                  />
                  <label
                    htmlFor="business-card-front"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Front
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, 'business_card_back');
                    }}
                    className="hidden"
                    id="business-card-back"
                  />
                  <label
                    htmlFor="business-card-back"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Back
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dealer.photos.filter(p => p.type.includes('business_card')).map((photo) => (
                  <div key={photo.id} className="bg-gray-100 rounded-lg p-4 text-center relative">
                    <p className="text-sm text-gray-600">{photo.originalName}</p>
                    <p className="text-xs text-gray-500 mt-1">{photo.type}</p>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badge Scanning Section */}
        <div className="mb-4">
          <AccordionSection section={sections[5]} />
          {sections[5].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Badge Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file, 'badge');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dealer.photos.filter(p => p.type === 'badge').map((photo) => (
                  <div key={photo.id} className="bg-gray-100 rounded-lg p-4 text-center relative">
                    <p className="text-sm text-gray-600">{photo.originalName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(photo.createdAt)}</p>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks and To Do's Section */}
        <div className="mb-4">
          <AccordionSection section={sections[6]} />
          {sections[6].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Add New Task</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    placeholder="Task title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                  <select
                    value={newTodo.type}
                    onChange={(e) => setNewTodo({ ...newTodo, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="general">General Task</option>
                    <option value="snail_mail">Snail Mail</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Due Date"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newTodo.followUp}
                        onChange={(e) => setNewTodo({ ...newTodo, followUp: e.target.checked })}
                      />
                      Follow-up
                    </label>
                  </div>
                  {newTodo.followUp && (
                    <input
                      type="date"
                      value={newTodo.followUpDate}
                      onChange={(e) => setNewTodo({ ...newTodo, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Follow-up Date"
                    />
                  )}
                  <button
                    onClick={handleAddTodo}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Task
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {dealer.todos.filter(todo => todo.type !== 'email' && !todo.completed).map((todo) => (
                  <div key={todo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={(e) => handleUpdateTodo(todo.id, { completed: e.target.checked })}
                          />
                          <span className="font-semibold">
                            {todo.title}
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {todo.type}
                          </span>
                        </div>
                        {todo.description && (
                          <p className="text-gray-600 mt-1">{todo.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {todo.dueDate && <span>Due: {formatDate(todo.dueDate)}</span>}
                          {todo.followUp && todo.followUpDate && (
                            <span>Follow-up: {formatDate(todo.followUpDate)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {dealer.todos.filter(todo => todo.type !== 'email' && !todo.completed).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending tasks</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Emails Section */}
        <div className="mb-4">
          <AccordionSection section={sections[7]} />
          {sections[7].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              {/* Send Email with Attachments */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3 text-blue-900">📧 Send Email to Dealer</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To: {dealer?.email || 'No email address'}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CC (Optional - separate multiple emails with commas)
                    </label>
                    <input
                      type="text"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="colleague@example.com, another@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email message body..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files (Select from uploaded files)
                    </label>
                    {emailFiles.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        No files available. Upload files from the Dashboard first.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                        {emailFiles.map((file) => (
                          <label key={file.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(file.id)}
                              onChange={(e) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:2220',message:'Checkbox changed',data:{fileId:file.id,checked:e.target.checked,currentSelectedIds:selectedFileIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                // #endregion
                                if (e.target.checked) {
                                  const newIds = [...selectedFileIds, file.id];
                                  // #region agent log
                                  fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:2224',message:'Adding file ID',data:{fileId:file.id,newSelectedIds:newIds,newIdsLength:newIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                  // #endregion
                                  setSelectedFileIds(newIds);
                                } else {
                                  const newIds = selectedFileIds.filter(id => id !== file.id);
                                  // #region agent log
                                  fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealerDetail.tsx:2230',message:'Removing file ID',data:{fileId:file.id,newSelectedIds:newIds,newIdsLength:newIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                  // #endregion
                                  setSelectedFileIds(newIds);
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {file.originalName}
                              {file.description && (
                                <span className="text-gray-500 ml-2">({file.description})</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !dealer?.email || !emailSubject.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Add New Email Task</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    placeholder="Email task title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                  <input
                    type="hidden"
                    value="email"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Due Date"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newTodo.followUp}
                        onChange={(e) => setNewTodo({ ...newTodo, followUp: e.target.checked })}
                      />
                      Follow-up
                    </label>
                  </div>
                  {newTodo.followUp && (
                    <input
                      type="date"
                      value={newTodo.followUpDate}
                      onChange={(e) => setNewTodo({ ...newTodo, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Follow-up Date"
                    />
                  )}
                  <button
                    onClick={() => {
                      setNewTodo({ ...newTodo, type: 'email' });
                      handleAddTodo();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Email Task
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {dealer.todos.filter(todo => todo.type === 'email' && !todo.completed).map((todo) => (
                  <div key={todo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={(e) => handleUpdateTodo(todo.id, { completed: e.target.checked })}
                          />
                          <span className="font-semibold">
                            {todo.title}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            Email
                          </span>
                        </div>
                        {todo.description && (
                          <p className="text-gray-600 mt-1">{todo.description}</p>
                        )}
                        {todo.emailSent && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-sm text-green-800">
                              Email sent: {todo.emailSentDate ? formatDate(todo.emailSentDate) : 'N/A'}
                            </p>
                            {todo.emailContent && (
                              <p className="text-xs text-gray-600 mt-1">{todo.emailContent}</p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {todo.dueDate && <span>Due: {formatDate(todo.dueDate)}</span>}
                          {todo.followUp && todo.followUpDate && (
                            <span>Follow-up: {formatDate(todo.followUpDate)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {dealer.todos.filter(todo => todo.type === 'email' && !todo.completed).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending email tasks</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Permissions Section */}
        <div className="mb-4">
          <AccordionSection section={sections[8]} />
          {sections[8].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">
                  Checking any box below, signifies that the User of the App asked for specific permission from the Dealer to be able to eg. send emails, take a photo of the tradeshow badge etc.
                </p>
              </div>
              <div className="space-y-4">
                {Object.entries(privacyPermissions).map(([permission, granted]) => (
                  <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={granted}
                        onChange={(e) => handlePrivacyPermissionChange(permission, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-gray-900 capitalize">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              {dealer.privacyPermissionHistory && dealer.privacyPermissionHistory.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  📋 See the <strong>Permissions and Change History</strong> accordion at the bottom of this page for a full log of all changes.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Associated Tradeshows Section */}
        <div className="mb-4">
          <AccordionSection section={sections[9]} />
          {sections[9].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              {/* Quick Associate with Tradeshow */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎪 Associate with Tradeshow
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTradeshowId}
                    onChange={(e) => setSelectedTradeshowId(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-yellow-100"
                  >
                    <option value="">Select a tradeshow...</option>
                    {tradeShows.map((ts) => {
                      const isCurrentShow = ts.startDate && ts.endDate && 
                        new Date() >= new Date(ts.startDate) && new Date() <= new Date(ts.endDate);
                      return (
                        <option key={ts.id} value={ts.id}>
                          {ts.name} {isCurrentShow ? '(Current)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={handleAssociateTradeshow}
                    disabled={!selectedTradeshowId}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Associate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select the tradeshow where you met this dealer. The current tradeshow (by date) is pre-selected.
                </p>
              </div>

              {/* List of Associated Tradeshows - derived from change history (deduplicated) */}
              <h4 className="font-semibold text-gray-900 mb-3">Associated Tradeshows History</h4>
              {dealer.changeHistory && (() => {
                // Filter to tradeshow_associated entries and de-duplicate by newValue
                const tradeShowChanges = dealer.changeHistory.filter(
                  (ch) => ch.fieldName === 'tradeshow_associated'
                );
                const seen = new Set<string>();
                const uniqueChanges = tradeShowChanges.filter((ch) => {
                  const key = ch.newValue || '';
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });

                if (uniqueChanges.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No tradeshows associated yet.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Use the dropdown above to associate this dealer with a tradeshow.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {uniqueChanges.map((ch) => (
                      <div key={ch.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {ch.newValue || 'Tradeshow association'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Recorded:</span> {formatDate(ch.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        <div className="mb-4">
          <AccordionSection section={sections[10]} />
          {sections[10].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="space-y-2">
                {dealer.todos.filter(todo => todo.completed).length > 0 ? (
                  dealer.todos.filter(todo => todo.completed).map((todo) => (
                    <div key={todo.id} className="bg-gray-100 rounded-lg p-4 opacity-75">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={(e) => handleUpdateTodo(todo.id, { completed: e.target.checked })}
                            />
                            <span className="font-semibold line-through text-gray-500">
                              {todo.title}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              todo.type === 'email' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {todo.type}
                            </span>
                          </div>
                          {todo.description && (
                            <p className="text-gray-400 mt-1 line-through">{todo.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                            {todo.dueDate && <span className="line-through">Due: {formatDate(todo.dueDate)}</span>}
                            {todo.followUp && todo.followUpDate && (
                              <span className="line-through">Follow-up: {formatDate(todo.followUpDate)}</span>
                            )}
                            {todo.completedAt && (
                              <span className="text-green-600 font-medium">
                                ✓ Completed: {formatDate(todo.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No completed tasks yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Buying Group History Section - Always Visible */}
        {dealer.buyingGroupHistory && dealer.buyingGroupHistory.length > 0 && (
          <div className="mb-4 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Buying Group History
              </h3>
              <div className="space-y-3">
                {dealer.buyingGroupHistory.map((history) => (
                  <div key={history.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{history.buyingGroup.name}</p>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Start Date:</span>{' '}
                            {formatDate(history.startDate)}
                          </p>
                          {history.endDate ? (
                            <p>
                              <span className="font-medium">End Date:</span>{' '}
                              {formatDate(history.endDate)}
                            </p>
                          ) : (
                            <p className="text-green-600 font-medium">Currently Active</p>
                          )}
                        </div>
                      </div>
                      {!history.endDate && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Permissions and Change History Section - Accordion at bottom */}
        <div className="mb-4 mt-4">
          <AccordionSection section={sections[11]} />
          {sections[11].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-4">
                This log tracks all changes made to this dealer record, including field updates and permission changes.
              </p>
              
              {/* All Changes - organized by type */}
              {dealer.changeHistory && dealer.changeHistory.length > 0 && (() => {
                // Deduplicate change history - keep most recent entry for each unique combination
                const seen = new Map<string, typeof dealer.changeHistory[0]>();
                const deduplicated = dealer.changeHistory
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
                  .filter((change) => {
                    // Create a unique key based on field type
                    let key: string;
                    if (change.fieldName === 'tradeshow_associated') {
                      // For tradeshows, deduplicate by fieldName + newValue (tradeshow name + date)
                      // Extract tradeshow name from newValue (format: "Tradeshow Name (Date)")
                      key = `${change.fieldName}:${change.newValue || ''}`;
                    } else if (change.fieldName === 'consent_permissions_finalized') {
                      // For consent finalization, deduplicate by fieldName only (one per dealer)
                      key = change.fieldName;
                    } else if (change.fieldName === 'product_added' || change.fieldName === 'product_removed') {
                      // For products, deduplicate by fieldName + product name
                      key = `${change.fieldName}:${change.newValue || change.oldValue || ''}`;
                    } else if (change.fieldName === 'badge_scanned') {
                      // For badge scans, deduplicate by fieldName + newValue (tradeshow name if present)
                      key = `${change.fieldName}:${change.newValue || ''}`;
                    } else if (change.fieldName === 'task_completed' || change.fieldName === 'task_reopened') {
                      // For tasks, deduplicate by fieldName + newValue (task title)
                      key = `${change.fieldName}:${change.newValue || ''}`;
                    } else {
                      // For other fields, deduplicate by fieldName + oldValue + newValue
                      // This removes exact duplicates while preserving legitimate sequential changes
                      key = `${change.fieldName}:${change.oldValue || ''}:${change.newValue || ''}`;
                    }
                    
                    if (seen.has(key)) {
                      return false; // Skip duplicate
                    }
                    seen.set(key, change);
                    return true;
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Re-sort by newest first

                return (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span>📋</span> All Changes
                    </h4>
                    <div className="space-y-2">
                      {deduplicated.map((change) => {
                      // Determine the styling and icon based on field type
                      let icon = '📝';
                      let bgColor = 'bg-blue-50';
                      let borderColor = 'border-blue-500';
                      let displayName = change.fieldName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
                      let displayValue = '';

                      switch (change.fieldName) {
                        case 'product_added':
                          icon = '📦';
                          bgColor = 'bg-green-50';
                          borderColor = 'border-green-500';
                          displayName = 'Product Added';
                          displayValue = change.newValue || '';
                          break;
                        case 'product_removed':
                          icon = '🗑️';
                          bgColor = 'bg-red-50';
                          borderColor = 'border-red-500';
                          displayName = 'Product Removed';
                          displayValue = change.oldValue || '';
                          break;
                        case 'badge_scanned':
                          icon = '📷';
                          bgColor = 'bg-purple-50';
                          borderColor = 'border-purple-500';
                          displayName = 'Badge Scanned';
                          displayValue = change.newValue || 'Badge captured';
                          break;
                        case 'tradeshow_associated':
                          icon = '🎪';
                          bgColor = 'bg-orange-50';
                          borderColor = 'border-orange-500';
                          displayName = 'Associated with Tradeshow';
                          displayValue = change.newValue || '';
                          break;
                        case 'task_completed':
                          icon = '✅';
                          bgColor = 'bg-teal-50';
                          borderColor = 'border-teal-500';
                          displayName = 'Task Completed';
                          displayValue = change.newValue || '';
                          break;
                        case 'task_reopened':
                          icon = '🔄';
                          bgColor = 'bg-yellow-50';
                          borderColor = 'border-yellow-500';
                          displayName = 'Task Reopened';
                          displayValue = change.newValue || '';
                          break;
                        case 'photos_permission':
                        case 'badge_scan_permission':
                        case 'audio_notes_permission':
                        case 'other_permissions_text':
                          icon = change.newValue?.includes('granted') ? '✓' : '✗';
                          bgColor = change.newValue?.includes('granted') ? 'bg-green-50' : 'bg-red-50';
                          borderColor = change.newValue?.includes('granted') ? 'border-green-500' : 'border-red-500';
                          displayValue = change.newValue || '';
                          break;
                        case 'consent_permissions_finalized':
                          icon = '🔒';
                          bgColor = 'bg-indigo-50';
                          borderColor = 'border-indigo-500';
                          displayName = 'Consent Permissions Finalized';
                          displayValue = change.newValue || '';
                          break;
                        default:
                          // Standard field change
                          displayValue = '';
                      }

                      return (
                        <div 
                          key={change.id} 
                          className={`${bgColor} rounded-lg p-3 border-l-4 ${borderColor}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span>{icon}</span>
                                <p className="font-medium text-gray-900 capitalize">
                                  {displayName}
                                </p>
                              </div>
                              {displayValue ? (
                                <div className="text-sm text-gray-700 mt-1">
                                  {displayValue}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600 mt-1">
                                  {change.oldValue && (
                                    <span className="line-through text-red-600 mr-2">
                                      {change.oldValue}
                                    </span>
                                  )}
                                  {change.newValue && (
                                    <span className="text-green-600">
                                      → {change.newValue}
                                    </span>
                                  )}
                                  {!change.oldValue && !change.newValue && (
                                    <span className="text-gray-500 italic">Value cleared</span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(change.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                );
              })()}
              
              {/* Permission Changes */}
              {dealer.privacyPermissionHistory && dealer.privacyPermissionHistory.length > 0 && (() => {
                // Deduplicate permission history - keep most recent entry for each unique permission + action combination
                const seen = new Map<string, typeof dealer.privacyPermissionHistory[0]>();
                const deduplicated = dealer.privacyPermissionHistory
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
                  .filter((history) => {
                    // For consent_finalized, only keep one entry (most recent)
                    if (history.permission === 'consent_finalized') {
                      const key = history.permission;
                      if (seen.has(key)) {
                        return false;
                      }
                      seen.set(key, history);
                      return true;
                    }
                    
                    // For other permissions, deduplicate by permission + action
                    const key = `${history.permission}:${history.action}`;
                    if (seen.has(key)) {
                      return false; // Skip duplicate
                    }
                    seen.set(key, history);
                    return true;
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Re-sort by newest first

                return (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span>🔒</span> Permission Changes
                    </h4>
                    <div className="space-y-2">
                      {deduplicated.map((history) => (
                      <div 
                        key={history.id} 
                        className={`rounded-lg p-3 border-l-4 ${
                          history.granted 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`${history.granted ? 'text-green-600' : 'text-red-600'}`}>
                                {history.granted ? '✓' : '✗'}
                              </span>
                              <p className="font-medium text-gray-900 capitalize">
                                {history.permission.replace(/_/g, ' ')}
                              </p>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                history.action === 'granted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : history.action === 'revoked'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {history.action}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(history.createdAt)}
                            </p>
                            {history.changedData && history.changedData.text && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Note:</span>{' '}
                                {history.changedData.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              {/* Empty state */}
              {(!dealer.changeHistory || dealer.changeHistory.length === 0) && 
               (!dealer.privacyPermissionHistory || dealer.privacyPermissionHistory.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No change history recorded yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Changes to dealer information and permissions will be logged here automatically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Buying Group Modal */}
      {showBuyingGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {dealer.buyingGroup ? 'Change Buying Group' : 'Assign Buying Group'}
            </h2>
            
            {/* Current Buying Group Display */}
            {dealer.buyingGroup && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Buying Group:</p>
                <p className="font-semibold text-gray-900">{dealer.buyingGroup}</p>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Buying Group
                </label>
                <button
                  onClick={() => {
                    setShowCreateBuyingGroup(!showCreateBuyingGroup);
                    setNewBuyingGroupName('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showCreateBuyingGroup ? 'Cancel' : '+ Create New'}
                </button>
              </div>
              
              {showCreateBuyingGroup ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newBuyingGroupName}
                    onChange={(e) => setNewBuyingGroupName(e.target.value)}
                    placeholder="Enter new buying group name"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateBuyingGroup();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateBuyingGroup}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create & Assign
                  </button>
                </div>
              ) : (
                <select
                  value={selectedBuyingGroupId}
                  onChange={(e) => setSelectedBuyingGroupId(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a buying group --</option>
                  {buyingGroups.map((bg) => (
                    <option key={bg.id} value={bg.id}>
                      {bg.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Remove Current Button - only show if dealer has a buying group */}
              {dealer.buyingGroup && (
                <button
                  onClick={handleRemoveBuyingGroup}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove Current Buying Group
                </button>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowBuyingGroupModal(false);
                    setSelectedBuyingGroupId('');
                    setShowCreateBuyingGroup(false);
                    setNewBuyingGroupName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignBuyingGroup}
                  disabled={!selectedBuyingGroupId && !showCreateBuyingGroup}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dealer.buyingGroup ? 'Change' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default DealerDetail;
