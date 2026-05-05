import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8081/api/notifications";
const LEAVES_API = "http://localhost:8081/api/leaves/leaves";

export default function Notifications({ isOpen, onClose, onUpdate, isAdmin, onNavigateToLeave }) {
  const [notifications, setNotifications] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const DISMISSED_STORAGE_KEY = "notification-dismissed-leave-ids";
  const DISMISSED_NOTIFICATION_IDS_KEY = "notification-dismissed-notification-ids";
  const loadDismissed = () => {
    try {
      const raw = sessionStorage.getItem(DISMISSED_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };
  const [dismissedLeaveIds, setDismissedLeaveIds] = useState(() => loadDismissed());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  /** IDs removed as read — survives in-flight refetch races and panel remounts */
  const dismissedNotificationIdsRef = useRef(new Set());
  const dismissedNotificationsInitialized = useRef(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/unread`, {
        headers: getAuthHeader(),
      });
      setUnreadCount(res.data?.unread_count || 0);
    } catch (err) {
      console.error("Error fetching unread count", err);
    }
  }, []);

  const filterDismissedNotifications = useCallback((rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.filter(
      (n) => !dismissedNotificationIdsRef.current.has(Number(n.notification_id))
    );
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: getAuthHeader(),
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setNotifications(filterDismissedNotifications(rows));
    } catch (err) {
      console.error("Error fetching notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filterDismissedNotifications]);

  useEffect(() => {
    if (dismissedNotificationsInitialized.current) return;
    dismissedNotificationsInitialized.current = true;
    try {
      const raw = sessionStorage.getItem(DISMISSED_NOTIFICATION_IDS_KEY);
      if (raw) {
        JSON.parse(raw).forEach((id) => {
          const n = Number(id);
          if (Number.isFinite(n)) dismissedNotificationIdsRef.current.add(n);
        });
      }
    } catch (_) {}
  }, []);

  const loadPendingLeaves = useCallback(async () => {
    try {
      const res = await axios.get(LEAVES_API, {
        headers: getAuthHeader(),
      });
      const data = res.data;
      const pending = Array.isArray(data) ? data.filter((l) => l.status === "pending") : [];
      setPendingLeaves(pending);
    } catch (err) {
      console.error("Error fetching pending leaves", err);
      setPendingLeaves([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      loadNotifications();
      loadUnreadCount();
      if (isAdmin) loadPendingLeaves();
    }
    const interval = setInterval(() => {
      if (mounted && !isOpenRef.current) {
        loadNotifications();
        loadUnreadCount();
        if (isAdmin) loadPendingLeaves();
        if (onUpdate) onUpdate();
      }
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isAdmin, onUpdate, loadNotifications, loadUnreadCount, loadPendingLeaves]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
      if (isAdmin) loadPendingLeaves();
      if (onUpdate) onUpdate();
    }
  }, [isOpen, isAdmin, onUpdate, loadNotifications, loadUnreadCount, loadPendingLeaves]);

  const persistDismissedNotificationIds = () => {
    try {
      sessionStorage.setItem(
        DISMISSED_NOTIFICATION_IDS_KEY,
        JSON.stringify([...dismissedNotificationIdsRef.current])
      );
    } catch (_) {}
  };

  const markAsRead = async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      console.warn("markAsRead: invalid notification_id", id);
      return;
    }
    dismissedNotificationIdsRef.current.add(numId);
    persistDismissedNotificationIds();
    setNotifications((prev) => prev.filter((n) => Number(n.notification_id) !== numId));
    try {
      await axios.post(
        `${API_BASE}/read`,
        { notification_id: numId },
        { headers: getAuthHeader() }
      );
      await loadUnreadCount();
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error("Error marking as read", err);
      dismissedNotificationIdsRef.current.delete(numId);
      persistDismissedNotificationIds();
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const idsToClear = notifications.map((n) => Number(n.notification_id)).filter(Number.isFinite);
    idsToClear.forEach((nid) => dismissedNotificationIdsRef.current.add(nid));
    persistDismissedNotificationIds();
    setNotifications([]);
    try {
      await axios.post(
        `${API_BASE}/read`,
        {},
        { headers: getAuthHeader() }
      );
      await loadUnreadCount();
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error("Error marking all as read", err);
      idsToClear.forEach((nid) => dismissedNotificationIdsRef.current.delete(nid));
      persistDismissedNotificationIds();
      loadNotifications();
    }
  };

  const formatLeaveDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day(s) ago`;

    return date.toLocaleDateString("en-IN");
  };

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h3>Notifications</h3>

        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {loading && !isAdmin ? (
          <div className="loading-container">Loading notifications...</div>
        ) : (
          <>
            {isAdmin && pendingLeaves.filter((l) => !dismissedLeaveIds.has(l.leave_id)).length > 0 && (
              <div className="notification-section">
                <div className="notification-section-title">Leave requests</div>
                {pendingLeaves.filter((l) => !dismissedLeaveIds.has(l.leave_id)).map((leave) => (
                  <div
                    key={leave.leave_id}
                    className="notification-item unread notification-item-leave"
                    onClick={() => {
                      const next = new Set(dismissedLeaveIds).add(leave.leave_id);
                      setDismissedLeaveIds(next);
                      try {
                        sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...next]));
                      } catch (_) {}
                      if (onNavigateToLeave) onNavigateToLeave();
                    }}
                  >
                    <div className="notification-content">
                      <p className="notification-message">
                        <strong>{leave.employee_name}</strong> applied for {leave.leave_type} leave ({formatLeaveDate(leave.start_date)} to {formatLeaveDate(leave.end_date)}, {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}). Pending approval.
                      </p>
                    </div>
                    <span className="notification-dot" />
                  </div>
                ))}
              </div>
            )}
            {notifications.length === 0 && (!isAdmin || pendingLeaves.filter((l) => !dismissedLeaveIds.has(l.leave_id)).length === 0) ? (
              <div className="no-data">No notifications</div>
            ) : (
              notifications.map((n) => {
                const handleClick = () => {
                  markAsRead(Number(n.notification_id));
                };
                return (
                <div
                  key={n.notification_id}
                  className={`notification-item ${!n.is_read ? "unread" : ""} ${n.title && n.title.toLowerCase().includes("new leave request") ? "notification-item-leave" : ""}`}
                  onClick={handleClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
                >
                  <div className="notification-content">
                    {n.title && (
                      <p className={`notification-title ${n.title.toLowerCase().includes("rejected") ? "notification-title-rejected" : n.title.toLowerCase().includes("approved") ? "notification-title-approved" : ""}`}>
                        {n.title}
                      </p>
                    )}
                    <p className="notification-message">{n.message}</p>
                    <span className="notification-time">
                      {formatDate(n.created_at)}
                    </span>
                  </div>

                  {!n.is_read && <span className="notification-dot" />}
                </div>
              );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
