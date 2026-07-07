"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Dynamically import map component with SSR disabled
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900/50 flex flex-col items-center justify-center rounded-2xl border border-purple-500/10 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple"></div>
      <p className="text-sm text-secondary font-medium animate-pulse">Đang tải bản đồ thế giới...</p>
    </div>
  )
});

interface EventData {
  id: number;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  event_date: string;
  organizer_type: string;
  organizer_id: number;
  organizer_name: string;
  organizer_avatar_url?: string;
  created_at?: string;
}

export default function MapPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  
  // Route selection
  const [routeToEvent, setRouteToEvent] = useState<EventData | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'my'>('all');

  // Event Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingOnMap, setIsCreatingOnMap] = useState(false);
  const [createCoords, setCreateCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Form Fields
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLat, setNewLat] = useState<number | ''>('');
  const [newLng, setNewLng] = useState<number | ''>('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newOrganizerType, setNewOrganizerType] = useState<'USER' | 'GROUP'>('USER');
  const [newOrganizerId, setNewOrganizerId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Get current user, groups, and events in parallel
      const [eventsRes, userRes] = await Promise.all([
        api.get('/events'),
        api.get('/users/me').catch(() => ({ data: null }))
      ]);

      setEvents(eventsRes.data || []);
      
      const userData = userRes.data;
      if (userData) {
        setCurrentUser(userData);
        // Load user's groups
        try {
          const groupsRes = await api.get('/groups/me');
          setMyGroups(groupsRes.data || []);
        } catch (err) {
          console.error("Không thể tải danh sách nhóm của tôi:", err);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu sự kiện:", error);
      toast.error("Không thể tải thông tin sự kiện");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = (event: EventData) => {
    setSelectedEvent(event);
    setRouteToEvent(null); // Clear routing when selecting a new event
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setCreateCoords({ lat, lng });
    setNewLat(Number(lat.toFixed(6)));
    setNewLng(Number(lng.toFixed(6)));

    // Try reverse geocoding via OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
      const data = await res.json();
      if (data && data.display_name) {
        setNewLocationName(data.display_name);
      }
    } catch (err) {
      console.error("Lỗi phân tích địa lý địa chỉ:", err);
    }
  };

  const handleCreateEventClick = () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để tạo sự kiện");
      return;
    }
    // Start map-selection mode
    setIsCreatingOnMap(true);
    setShowCreateModal(true);
    toast.success("Vui lòng click chọn 1 vị trí trên bản đồ", { icon: "📍" });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) return toast.error("Vui lòng nhập tên sự kiện");
    if (!newLocationName.trim()) return toast.error("Vui lòng nhập tên địa điểm");
    if (newLat === '' || newLng === '') return toast.error("Vui lòng chọn vị trí trên bản đồ");
    if (!newEventDate) return toast.error("Vui lòng chọn thời gian diễn ra");

    let organizerIdValue = currentUser.id;
    if (newOrganizerType === 'GROUP') {
      if (!newOrganizerId) {
        return toast.error("Vui lòng chọn nhóm tổ chức");
      }
      organizerIdValue = Number(newOrganizerId);
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/events', {
        title: newTitle,
        description: newDescription,
        location_name: newLocationName,
        latitude: newLat,
        longitude: newLng,
        event_date: newEventDate, // datetime-local format is standard JSON parseable
        organizer_type: newOrganizerType,
        organizer_id: organizerIdValue
      });

      toast.success("🎉 Tạo sự kiện thành công!");
      
      // Refresh event list
      const eventsRes = await api.get('/events');
      const updatedEvents = eventsRes.data || [];
      setEvents(updatedEvents);

      // Select newly created event
      const newEvent = updatedEvents.find((ev: any) => ev.title === newTitle);
      if (newEvent) setSelectedEvent(newEvent);

      // Reset Form and Modal
      setShowCreateModal(false);
      setIsCreatingOnMap(false);
      setCreateCoords(null);
      setNewTitle('');
      setNewDescription('');
      setNewLocationName('');
      setNewLat('');
      setNewLng('');
      setNewEventDate('');
      setNewOrganizerType('USER');
      setNewOrganizerId('');

    } catch (error: any) {
      console.error("Lỗi khi tạo sự kiện:", error);
      toast.error(error.response?.data?.message || "Không thể tạo sự kiện");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) return;

    try {
      await api.delete(`/events/${eventId}`);
      toast.success("Đã xóa sự kiện thành công");
      setSelectedEvent(null);
      setRouteToEvent(null);
      
      // Reload events
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch (error: any) {
      console.error("Lỗi xóa sự kiện:", error);
      toast.error("Không thể xóa sự kiện");
    }
  };

  // Check if current user is owner
  const isOrganizer = (event: EventData) => {
    if (!currentUser) return false;
    
    if (event.organizer_type === 'USER') {
      return event.organizer_id === currentUser.id;
    } else if (event.organizer_type === 'GROUP') {
      // Find if user is admin in this group
      const myGroup = myGroups.find(g => g.id === event.organizer_id);
      return myGroup && (myGroup.userRole === 'ADMIN' || myGroup.creatorId === currentUser.id);
    }
    return false;
  };

  // Filter events
  const filteredEvents = events.filter(ev => {
    if (filterType === 'all') return true;
    if (filterType === 'my') {
      if (!currentUser) return false;
      if (ev.organizer_type === 'USER') {
        return ev.organizer_id === currentUser.id;
      } else {
        // Group event that user belongs to
        return myGroups.some(g => g.id === ev.organizer_id);
      }
    }
    return true;
  });

  const parseBackendDate = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (Array.isArray(dateVal)) {
      const year = dateVal[0] || 2026;
      const month = (dateVal[1] || 1) - 1;
      const day = dateVal[2] || 1;
      const hour = dateVal[3] || 0;
      const minute = dateVal[4] || 0;
      const second = dateVal[5] || 0;
      return new Date(year, month, day, hour, minute, second);
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return new Date();
    }
    return d;
  };

  const formatDate = (dateVal: any) => {
    const d = parseBackendDate(dateVal);
    return d.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayMonth = (dateVal: any) => {
    const d = parseBackendDate(dateVal);
    return {
      day: d.getDate(),
      month: `T${d.getMonth() + 1}`,
      year: d.getFullYear()
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4 w-full flex-1">
        <Sidebar />

        <main className="flex-1 py-4 md:py-6 flex flex-col lg:flex-row gap-4 h-[calc(100vh-3.5rem)] overflow-hidden max-w-5xl mx-auto w-full">
          
          {/* Left panel: list & details */}
          <div className="w-full lg:w-96 flex flex-col gap-4 flex-shrink-0 h-full overflow-hidden">
            
            {/* Header info */}
            <div className="glass-card rounded-2xl p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-extrabold gradient-text flex items-center gap-2">
                  🗺️ Bản đồ Sự kiện
                </h1>
                {currentUser && (
                  <button 
                    onClick={handleCreateEventClick}
                    className="px-3 py-1.5 btn-anime rounded-xl text-xs flex items-center gap-1"
                  >
                    <span>➕ Tạo mới</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Khám phá các buổi offline, fes anime đang và sắp diễn ra. Click chọn sự kiện để xem chi tiết và dẫn đường đi.
              </p>

              {/* Filters */}
              {currentUser && (
                <div className="flex gap-1.5 mt-3 border-t border-purple-500/10 pt-3">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      filterType === 'all' 
                        ? 'bg-purple-500/10 text-accent-purple border border-purple-500/20' 
                        : 'text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Tất cả sự kiện
                  </button>
                  <button
                    onClick={() => setFilterType('my')}
                    className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      filterType === 'my' 
                        ? 'bg-purple-500/10 text-accent-purple border border-purple-500/20' 
                        : 'text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Tôi tham gia / Nhóm
                  </button>
                </div>
              )}
            </div>

            {/* List or Detail View */}
            <div className="flex-1 overflow-y-auto pr-1">
              {selectedEvent ? (
                /* Detail View */
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-4 animate-slide-up h-fit border border-purple-500/20">
                  <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
                    <button 
                      onClick={() => setSelectedEvent(null)}
                      className="text-xs font-bold text-accent-cyan flex items-center gap-1.5 hover:underline cursor-pointer"
                    >
                      ← Danh sách sự kiện
                    </button>
                    {isOrganizer(selectedEvent) && (
                      <button 
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                        title="Xóa sự kiện"
                      >
                        🗑️ Xóa sự kiện
                      </button>
                    )}
                  </div>

                  {/* Header Title */}
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-snug">{selectedEvent.title}</h2>
                    <p className="text-xs text-accent-pink font-semibold mt-1 flex items-center gap-1.5">
                      📅 {formatDate(selectedEvent.event_date)}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="bg-black/10 dark:bg-black/30 rounded-xl p-3 border border-purple-500/5">
                    <div className="text-xs font-bold text-secondary mb-1">📍 Địa điểm</div>
                    <div className="text-xs text-foreground font-medium leading-relaxed">{selectedEvent.location_name}</div>
                    <div className="text-[10px] text-muted mt-1.5 font-mono">
                      Tọa độ: {selectedEvent.latitude.toFixed(5)}, {selectedEvent.longitude.toFixed(5)}
                    </div>
                  </div>

                  {/* Organizer info */}
                  <div className="flex items-center gap-3 border-t border-b border-purple-500/10 py-3">
                    {selectedEvent.organizer_avatar_url ? (
                      <img 
                        src={selectedEvent.organizer_avatar_url} 
                        alt={selectedEvent.organizer_name} 
                        className="w-10 h-10 rounded-full object-cover avatar-glow"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold text-sm">
                        {selectedEvent.organizer_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                        Tổ chức bởi {selectedEvent.organizer_type === 'GROUP' ? 'Nhóm' : 'Thành viên'}
                      </div>
                      <div className="font-bold text-sm text-foreground truncate">{selectedEvent.organizer_name}</div>
                    </div>
                    <div>
                      {selectedEvent.organizer_type === 'GROUP' ? (
                        <Link 
                          href={`/groups/${selectedEvent.organizer_id}`}
                          className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 text-xs font-semibold rounded-lg text-accent-purple"
                        >
                          Ghé nhóm
                        </Link>
                      ) : (
                        <Link 
                          href={`/profile/${selectedEvent.organizer_id}`}
                          className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 text-xs font-semibold rounded-lg text-accent-purple"
                        >
                          Trang cá nhân
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-xs font-bold text-secondary mb-1.5">📝 Chi tiết sự kiện</div>
                    <p className="text-xs text-secondary leading-relaxed whitespace-pre-line bg-black/5 dark:bg-white/[0.01] p-3 rounded-xl border border-purple-500/5">
                      {selectedEvent.description || "Chưa có mô tả chi tiết cho sự kiện này."}
                    </p>
                  </div>

                  {/* Action Route */}
                  <button
                    onClick={() => setRouteToEvent(selectedEvent)}
                    className="w-full py-3 btn-anime rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-2"
                  >
                    <span>🛣️ Tìm đường đi tới đây</span>
                  </button>
                </div>
              ) : (
                /* List View */
                <div className="flex flex-col gap-2.5">
                  {filteredEvents.length === 0 ? (
                    <div className="glass-card rounded-2xl py-12 px-4 text-center text-muted/60 text-xs italic">
                      {isLoading ? (
                        <div className="flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-purple"></div></div>
                      ) : (
                        "Không tìm thấy sự kiện nào"
                      )}
                    </div>
                  ) : (
                    filteredEvents.map(ev => {
                      const dm = getDayMonth(ev.event_date);
                      const isSel = selectedEvent ? (selectedEvent as EventData).id === ev.id : false;
                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleSelectEvent(ev)}
                          className={`glass-card glass-card-hover rounded-xl p-3.5 flex gap-3.5 cursor-pointer transition-all duration-300 border ${
                            isSel ? 'border-pink-500/40 bg-pink-500/5' : 'border-purple-500/10'
                          }`}
                        >
                          {/* Calendar block */}
                          <div className="w-12 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[10px] text-accent-pink font-extrabold uppercase">{dm.month}</span>
                            <span className="text-lg font-black text-foreground">{dm.day}</span>
                          </div>

                          {/* Event info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="font-bold text-foreground text-xs leading-snug truncate mb-1">{ev.title}</h3>
                            <p className="text-[10px] text-muted truncate mb-1">📍 {ev.location_name}</p>
                            <p className="text-[9px] text-accent-cyan font-bold truncate">👑 {ev.organizer_name}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Full map */}
          <div className="flex-1 h-full min-h-[300px] lg:min-h-0">
            <MapComponent 
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={handleSelectEvent}
              isCreating={isCreatingOnMap}
              createCoords={createCoords}
              onMapClick={handleMapClick}
              routeToEvent={routeToEvent}
              onClearRoute={() => setRouteToEvent(null)}
            />
          </div>

        </main>
      </div>

      {/* Event Creation Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-purple-500/20">
            
            {/* Header */}
            <div className="border-b border-purple-500/10 px-5 py-4 flex items-center justify-between bg-black/10 dark:bg-white/[0.01]">
              <div>
                <h3 className="font-bold text-foreground text-sm">Tạo Sự Kiện Bản Đồ Mới</h3>
                <p className="text-[10px] text-muted">Điền thông tin và nhấp chọn điểm trên bản đồ</p>
              </div>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setIsCreatingOnMap(false);
                }}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 max-h-[75vh] overflow-y-auto">
              
              {/* Form Info details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-secondary mb-1.5 uppercase tracking-wider">Tên sự kiện *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lễ hội Anime Fes 2026..." 
                    className="w-full px-3 py-2.5 input-anime rounded-xl text-xs text-foreground focus:outline-none placeholder-muted/40"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-secondary mb-1.5 uppercase tracking-wider">Mô tả sự kiện</label>
                  <textarea 
                    placeholder="Mô tả các hoạt động, vé tham gia, lịch trình..." 
                    rows={3}
                    className="w-full px-3 py-2.5 input-anime rounded-xl text-xs text-foreground focus:outline-none resize-none placeholder-muted/40"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Coordinates and Location picker */}
              <div className="bg-black/10 dark:bg-black/30 p-4 rounded-xl border border-purple-500/10 mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-accent-cyan uppercase tracking-wider">Vị trí bản đồ *</span>
                  <span className="text-[10px] text-muted italic">Click bản đồ để chọn tọa độ</span>
                </div>
                
                {/* Coordinates displaying */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-muted uppercase font-mono">Vĩ độ (Latitude)</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      readOnly
                      placeholder="Chọn trên bản đồ"
                      className="w-full px-3 py-2 bg-black/20 border border-purple-500/10 text-muted rounded-lg text-xs font-mono"
                      value={newLat}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-muted uppercase font-mono">Kinh độ (Longitude)</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      readOnly
                      placeholder="Chọn trên bản đồ"
                      className="w-full px-3 py-2 bg-black/20 border border-purple-500/10 text-muted rounded-lg text-xs font-mono"
                      value={newLng}
                    />
                  </div>
                </div>

                {/* Location text representation */}
                <div>
                  <label className="block text-[9px] text-muted uppercase font-bold">Địa chỉ địa điểm</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 54 Liễu Giai, Hà Nội" 
                    className="w-full px-3 py-2.5 input-anime rounded-lg text-xs text-foreground focus:outline-none placeholder-muted/40 mt-1"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                  />
                </div>
              </div>

              {/* Date and Organizer details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1.5 uppercase tracking-wider">Thời gian diễn ra *</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full px-3 py-2.5 input-anime rounded-xl text-xs text-foreground focus:outline-none"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1.5 uppercase tracking-wider">Ban tổ chức *</label>
                  <div className="flex gap-2">
                    <select
                      className="px-2 py-2.5 input-anime rounded-xl text-xs text-foreground focus:outline-none w-1/3"
                      value={newOrganizerType}
                      onChange={(e) => {
                        const val = e.target.value as 'USER' | 'GROUP';
                        setNewOrganizerType(val);
                        if (val === 'GROUP' && myGroups.length > 0) {
                          setNewOrganizerId(myGroups[0].id);
                        } else {
                          setNewOrganizerId('');
                        }
                      }}
                    >
                      <option value="USER">Cá nhân</option>
                      <option value="GROUP">Nhóm</option>
                    </select>

                    {newOrganizerType === 'GROUP' ? (
                      <select
                        required
                        className="px-2 py-2.5 input-anime rounded-xl text-xs text-foreground focus:outline-none flex-1"
                        value={newOrganizerId}
                        onChange={(e) => setNewOrganizerId(Number(e.target.value))}
                      >
                        {myGroups.length === 0 ? (
                          <option value="">(Bạn chưa tham gia nhóm nào)</option>
                        ) : (
                          myGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))
                        )}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        readOnly
                        className="px-3 py-2.5 bg-black/20 border border-purple-500/10 text-muted rounded-xl text-xs flex-1 cursor-not-allowed font-medium"
                        value={currentUser?.username || "Đang tải..."}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-purple-500/10 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsCreatingOnMap(false);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-muted bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 btn-anime rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    "Đăng sự kiện"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
