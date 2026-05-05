import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8081';

const TOTAL_LEAVES = 15;

function getSpeechRecognition() {
  return typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
}

function MicOutlineIcon() {
  return (
    <svg
      className="leave-reason-icon-svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg
      className="leave-reason-wave-svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="3" y="12" width="2.5" height="7" rx="1" fill="currentColor" />
      <rect x="8.5" y="7" width="2.5" height="17" rx="1" fill="currentColor" />
      <rect x="14" y="10" width="2.5" height="11" rx="1" fill="currentColor" />
      <rect x="19.5" y="14" width="2.5" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}

function DictateStopIcon() {
  return (
    <svg
      className="leave-reason-icon-svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  );
}

function PlayTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function PauseBarsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="5" width="5" height="14" rx="1" fill="currentColor" />
      <rect x="13" y="5" width="5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

function TrashOutlineIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatVoiceDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function seededWaveformHeights(count, seed) {
  const bars = [];
  let x = Math.abs(seed) % 100000 || 1;
  for (let i = 0; i < count; i += 1) {
    x = (x * 1103515245 + 12345) >>> 0;
    bars.push(0.25 + (x % 75) / 100);
  }
  return bars;
}

function LeaveVoiceNotePreview({ voiceBlob, onRemove, disabled }) {
  const audioRef = useRef(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const bars = useMemo(
    () => seededWaveformHeights(52, voiceBlob?.size ?? 1),
    [voiceBlob]
  );

  useEffect(() => {
    if (!voiceBlob) {
      setObjectUrl('');
      setPlaying(false);
      setDuration(0);
      return;
    }
    const url = URL.createObjectURL(voiceBlob);
    setObjectUrl(url);
    return () => {
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
        } catch {
          /* ignore */
        }
      }
      setPlaying(false);
      URL.revokeObjectURL(url);
    };
  }, [voiceBlob]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !objectUrl) return undefined;

    const onMeta = () => {
      const d = a.duration;
      setDuration(Number.isFinite(d) ? d : 0);
    };
    const onEnded = () => {
      setPlaying(false);
      try {
        a.currentTime = 0;
      } catch {
        /* ignore */
      }
    };
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);

    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    a.addEventListener('pause', onPause);
    a.addEventListener('play', onPlay);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('play', onPlay);
    };
  }, [objectUrl]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !objectUrl) return;
    if (playing) {
      a.pause();
    } else {
      void a.play().catch(() => {});
    }
  };

  return (
    <div className="leave-voice-preview" role="region" aria-label="Voice note preview">
      <audio
        ref={audioRef}
        src={objectUrl || undefined}
        preload="metadata"
        className="leave-voice-preview-audio"
      />
      <div className="leave-voice-preview-player">
        <button
          type="button"
          className="leave-voice-preview-play"
          onClick={togglePlay}
          disabled={disabled || !objectUrl}
          aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        >
          {playing ? <PauseBarsIcon /> : <PlayTriangleIcon />}
        </button>
        <span className="leave-voice-preview-status-dot" title="Voice note ready" aria-hidden />
        <div className="leave-voice-preview-wave" aria-hidden>
          {bars.map((h, i) => (
            <span
              key={i}
              className="leave-voice-preview-bar"
              style={{ height: `${Math.round(6 + h * 22)}px` }}
            />
          ))}
        </div>
        <span className="leave-voice-preview-duration">{formatVoiceDuration(duration)}</span>
      </div>
      <div className="leave-voice-preview-actions">
        <button
          type="button"
          className="leave-voice-preview-trash"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Delete voice note"
          title="Delete recording"
        >
          <TrashOutlineIcon />
        </button>
      </div>
    </div>
  );
}

export default function Leave({ onUpdate }) {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState({
    total_leaves: TOTAL_LEAVES,
    used_leaves: 0,
    remaining_leaves: TOTAL_LEAVES,
    year: new Date().getFullYear(),
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'Casual',
    reason: '',
  });
  const [message, setMessage] = useState('');
  const [listening, setListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');
  const recognitionRef = useRef(null);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [recordingVoiceClip, setRecordingVoiceClip] = useState(false);
  const mediaRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
    setSpeechInterim('');
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchBalance();
  }, []);

  useEffect(() => {
    return () => stopRecognition();
  }, [stopRecognition]);

  const stopOptionalVoiceRecording = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    mediaRecorderRef.current = null;
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
    }
    setRecordingVoiceClip(false);
  }, []);

  useEffect(() => {
    return () => stopOptionalVoiceRecording();
  }, [stopOptionalVoiceRecording]);

  useEffect(() => {
    if (!showForm) {
      stopRecognition();
      stopOptionalVoiceRecording();
      setVoiceBlob(null);
    }
  }, [showForm, stopRecognition, stopOptionalVoiceRecording]);

  const voiceNoteUrl = (p) =>
    p ? `${API_BASE}${p.startsWith('/') ? p : `/${p}`}` : null;

  const toggleOptionalVoiceRecording = async () => {
    setMessage('');
    if (recordingVoiceClip) {
      mediaRecorderRef.current?.stop();
      return;
    }
    stopRecognition();
    setVoiceBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType: mime });
      voiceChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) voiceChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        if (voiceStreamRef.current) {
          voiceStreamRef.current.getTracks().forEach((t) => t.stop());
          voiceStreamRef.current = null;
        }
        const chunks = voiceChunksRef.current;
        voiceChunksRef.current = [];
        if (chunks.length > 0) {
          setVoiceBlob(new Blob(chunks, { type: mime }));
        }
        mediaRecorderRef.current = null;
        setRecordingVoiceClip(false);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setRecordingVoiceClip(true);
    } catch (err) {
      console.error(err);
      setMessage('Could not access the microphone for an optional voice clip.');
      stopOptionalVoiceRecording();
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/leaves/leave/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data);
    } catch (err) {
      console.log('Error fetching leave balance:', err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/leaves/leave/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data || []);
    } catch (err) {
      console.log('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDictation = () => {
    setMessage('');
    if (listening) {
      stopRecognition();
      return;
    }
    stopOptionalVoiceRecording();

    const SR = getSpeechRecognition();
    if (!SR) {
      setMessage(
        'Speech-to-text is not available here — you can still type or use the voice note button.'
      );
      return;
    }

    const recognition = new SR();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      let finals = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finals += piece;
        } else {
          interim += piece;
        }
      }
      setSpeechInterim(interim);
      if (finals.trim()) {
        setFormData((prev) => {
          const base = (prev.reason || '').trim();
          const add = finals.trim();
          const next = base ? `${base} ${add}` : add;
          return { ...prev, reason: next };
        });
      }
    };

    recognition.onerror = (ev) => {
      console.error(ev);
      if (ev.error === 'not-allowed') {
        setMessage('Microphone access denied. Allow the mic to dictate your reason.');
      } else if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
        setMessage(`Speech recognition: ${ev.error}. You can keep typing instead.`);
      }
      stopRecognition();
    };

    recognition.onend = () => {
      setListening(false);
      setSpeechInterim('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      console.error(err);
      setMessage('Could not start speech recognition. Try again or type your reason.');
      recognitionRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reason = (formData.reason || '').trim();
    const hasVoice = Boolean(voiceBlob);
    if (!reason && !hasVoice) {
      setMessage(
        'Add a reason by typing, dictating (mic), or recording a voice note — any one or more is fine.'
      );
      return;
    }

    setLoading(true);
    setMessage('');
    stopRecognition();

    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/leaves/leaves`;
      const auth = { Authorization: `Bearer ${token}` };

      if (voiceBlob) {
        const fd = new FormData();
        fd.append('start_date', formData.start_date);
        fd.append('end_date', formData.end_date);
        fd.append('leave_type', formData.leave_type);
        fd.append('reason', reason);
        fd.append('voice_note', voiceBlob, 'voice-note.webm');
        await axios.post(url, fd, { headers: auth });
      } else {
        await axios.post(
          url,
          {
            start_date: formData.start_date,
            end_date: formData.end_date,
            leave_type: formData.leave_type,
            reason: reason || '',
          },
          {
            headers: {
              ...auth,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      setMessage('Leave application submitted successfully! Notifications sent to admin and manager.');
      setShowForm(false);
      setVoiceBlob(null);
      setFormData({
        start_date: '',
        end_date: '',
        leave_type: 'Casual',
        reason: '',
      });
      fetchLeaves();
      fetchBalance();
      if (onUpdate) {
        setTimeout(() => onUpdate(), 1000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const speechSupported = Boolean(getSpeechRecognition());
  const voiceRecSupported =
    typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  return (
    <div className="leave-content">
      <div className="leave-header">
        <h2 className="section-title">Leave Management</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Apply for Leave'}
        </button>
      </div>

      <div className="leave-balance-wrapper">
        <div className="leave-balance-header">
          <h3 className="leave-balance-title">Leave Balance</h3>
          <span className="leave-balance-year">{balance.year}</span>
        </div>
        <div className="leave-balance-cards">
          <div className="leave-balance-stat leave-balance-stat-total">
            <span className="leave-balance-stat-label">Total</span>
            <span className="leave-balance-stat-value">{balance.total_leaves}</span>
            <span className="leave-balance-stat-unit">days</span>
          </div>
          <div className="leave-balance-stat leave-balance-stat-used">
            <span className="leave-balance-stat-label">Used</span>
            <span className="leave-balance-stat-value">{balance.used_leaves}</span>
            <span className="leave-balance-stat-unit">days</span>
          </div>
          <div className="leave-balance-stat leave-balance-stat-remaining">
            <span className="leave-balance-stat-label">Remaining</span>
            <span className="leave-balance-stat-value">{balance.remaining_leaves}</span>
            <span className="leave-balance-stat-unit">days</span>
          </div>
        </div>
        <div className="leave-balance-progress-wrap">
          <div
            className="leave-balance-progress-bar"
            style={{
              '--used-pct': `${balance.total_leaves ? (balance.used_leaves / balance.total_leaves) * 100 : 0}%`,
            }}
          >
            <div className="leave-balance-progress-used" />
            <div className="leave-balance-progress-remaining" />
          </div>
          <div className="leave-balance-progress-labels">
            <span>Used</span>
            <span>Available</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="leave-form-card">
          <h3>Apply for Leave</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leave-start">Start Date</label>
                <input
                  id="leave-start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="leave-end">End Date</label>
                <input
                  id="leave-end"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="leave-type">Leave Type</label>
              <select
                id="leave-type"
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                required
              >
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="leave-reason">Reason</label>
              <p className="leave-reason-field-hint">
                Type, dictate (mic), or record a voice note — use any one or mix them together.
              </p>
              <div className="leave-reason-wrap">
                <textarea
                  id="leave-reason"
                  className="leave-reason-textarea"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  placeholder="Optional if you attach a voice note — otherwise type or dictate here."
                />
                <div className="leave-reason-toolbar" role="toolbar" aria-label="Dictation and voice note">
                  <button
                    type="button"
                    className={`leave-reason-dictate-btn ${listening ? 'leave-reason-dictate-btn--active' : ''}`}
                    onClick={toggleDictation}
                    disabled={!speechSupported}
                    title={
                      speechSupported
                        ? listening
                          ? 'Stop dictation'
                          : 'Dictate (speech to text)'
                        : 'Dictation not supported in this browser'
                    }
                    aria-pressed={listening}
                    aria-label={listening ? 'Stop dictation' : 'Start dictation'}
                  >
                    {listening ? <DictateStopIcon /> : <MicOutlineIcon />}
                  </button>
                  <button
                    type="button"
                    className={`leave-reason-voice-btn ${recordingVoiceClip ? 'leave-reason-voice-btn--recording' : ''} ${voiceBlob && !recordingVoiceClip ? 'leave-reason-voice-btn--saved' : ''}`}
                    onClick={toggleOptionalVoiceRecording}
                    disabled={loading || !voiceRecSupported}
                    title={
                      !voiceRecSupported
                        ? 'Voice recording not supported in this browser'
                        : recordingVoiceClip
                          ? 'Stop recording voice note'
                          : voiceBlob
                            ? 'Re-record voice note'
                            : 'Record voice note for admins'
                    }
                    aria-pressed={recordingVoiceClip}
                    aria-label={
                      recordingVoiceClip ? 'Stop recording voice note' : 'Record voice note'
                    }
                  >
                    {recordingVoiceClip ? <DictateStopIcon /> : <WaveformIcon />}
                  </button>
                </div>
              </div>
              {voiceBlob && !recordingVoiceClip && (
                <LeaveVoiceNotePreview
                  voiceBlob={voiceBlob}
                  onRemove={() => setVoiceBlob(null)}
                  disabled={loading}
                />
              )}
              {listening && speechInterim && (
                <p className="leave-reason-interim" aria-live="polite">
                  {speechInterim}
                </p>
              )}
              {listening && (
                <p className="leave-reason-listening">Listening… tap the mic again to stop.</p>
              )}
              {!speechSupported && (
                <p className="leave-reason-hint">Tip: Chrome or Edge supports dictation in this field.</p>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || listening || recordingVoiceClip}
            >
              {loading
                ? 'Submitting...'
                : recordingVoiceClip
                  ? 'Stop recording to submit…'
                  : listening
                    ? 'Stop dictation to submit…'
                    : 'Submit application'}
            </button>
          </form>
        </div>
      )}

      <div className="leaves-list">
        <h3>My Leave Applications</h3>
        {loading && leaves.length === 0 ? (
          <div className="loading-container">Loading leaves...</div>
        ) : leaves.length === 0 ? (
          <div className="no-data">No leave applications found</div>
        ) : (
          <table className="leaves-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Leave Type</th>
                <th>Reason</th>
                <th>Voice</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.leave_id}>
                  <td>{new Date(leave.start_date).toLocaleDateString('en-US')}</td>
                  <td>{new Date(leave.end_date).toLocaleDateString('en-US')}</td>
                  <td>{leave.total_days} days</td>
                  <td>{leave.leave_type}</td>
                  <td className="leave-table-reason">
                    {leave.reason?.trim()
                      ? leave.reason
                      : leave.voice_note_path
                        ? '(Voice note only)'
                        : '—'}
                  </td>
                  <td>
                    {voiceNoteUrl(leave.voice_note_path) ? (
                      <audio
                        controls
                        src={voiceNoteUrl(leave.voice_note_path)}
                        className="leave-table-audio"
                        preload="metadata"
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(leave.status)}`}>
                      {leave.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
