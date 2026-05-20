import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { getMovieById, getShowsByMovie } from '../services/api';

const DAYS_AHEAD = 7;

// ─── Calendar Portal ─────────────────────────────────────────────────────────
const CalendarPicker = ({ anchorRef, selectedDate, onSelect, onClose }) => {
  const [viewYear, setViewYear]   = useState(() => (selectedDate || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selectedDate || new Date()).getMonth());
  const [pos, setPos]             = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);

  // Position the popup below the anchor button
  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({
        top:  r.bottom + window.scrollY + 8,
        left: Math.max(8, r.left + window.scrollX - 110)
      });
    }
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  const today = new Date(); today.setHours(0,0,0,0);

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };

  const firstDay     = new Date(viewYear, viewMonth, 1);
  const startOffset  = (firstDay.getDay() + 6) % 7;   // Monday=0
  const daysInMonth  = new Date(viewYear, viewMonth+1, 0).getDate();
  const daysInPrev   = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = startOffset-1; i >= 0; i--) cells.push({ day: daysInPrev-i, curr: false });
  for (let d = 1; d <= daysInMonth; d++)   cells.push({ day: d, curr: true });
  while (cells.length % 7 !== 0)           cells.push({ day: cells.length-startOffset-daysInMonth+1, curr: false });

  const toStr = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
  const selStr = toStr(selectedDate);

  const popup = (
    <div
      ref={popupRef}
      style={{
        position: 'absolute',
        top:  pos.top,
        left: pos.left,
        zIndex: 99999,
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        padding: '18px 16px 14px',
        width: '310px',
        border: '1px solid #e9ecef',
        userSelect: 'none'
      }}
    >
      {/* Month navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <button onClick={prevMonth} style={navBtn}>&#8592;</button>
        <span style={{ fontWeight:'700', fontSize:'1rem', color:'#222' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={navBtn}>&#8594;</button>
      </div>

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'6px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:'700', color:'#999', padding:'4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {cells.map((cell, i) => {
          if (!cell.curr) return (
            <div key={i} style={{ textAlign:'center', padding:'8px 0', color:'#ccc', fontSize:'0.82rem' }}>{cell.day}</div>
          );
          const cellDate = new Date(viewYear, viewMonth, cell.day);
          const isPast   = cellDate < today;
          const isToday  = toStr(cellDate) === toStr(today);
          const isSel    = toStr(cellDate) === selStr;
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => { onSelect(cellDate); onClose(); }}
              style={{
                textAlign:'center', padding:'7px 0',
                fontSize:'0.88rem',
                fontWeight: isSel ? '800' : isToday ? '700' : '400',
                borderRadius:'50%', border:'none',
                cursor: isPast ? 'not-allowed' : 'pointer',
                backgroundColor: isSel ? '#e63946' : 'transparent',
                color: isSel ? '#fff' : isPast ? '#d0d0d0' : isToday ? '#e63946' : '#333',
                transition:'background 0.12s',
                outline:'none',
                textDecoration: isToday && !isSel ? 'underline' : 'none'
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Footer shortcuts */}
      <div style={{ marginTop:'12px', display:'flex', justifyContent:'space-between' }}>
        <button onClick={() => { onSelect(new Date()); onClose(); }}
          style={{ fontSize:'0.78rem', color:'#e63946', border:'none', background:'none', cursor:'pointer', fontWeight:'700', padding:0 }}>
          Today
        </button>
        <button onClick={onClose}
          style={{ fontSize:'0.78rem', color:'#aaa', border:'none', background:'none', cursor:'pointer', padding:0 }}>
          Close ✕
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(popup, document.body);
};

const navBtn = {
  border:'none', background:'#f1f3f5', borderRadius:'8px',
  padding:'4px 14px', cursor:'pointer', fontSize:'1rem', color:'#555', fontWeight:'700'
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TheatreSelectionPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie]             = useState(null);
  const [shows, setShows]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarBtnRef                = useRef(null);

  const dateOptions = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0,0,0,0); return d;
  });

  useEffect(() => { fetchData(); }, [movieId]);
  useEffect(() => { if (selectedDate === null) setSelectedDate(dateOptions[0]); }, [shows]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([getMovieById(movieId), getShowsByMovie(movieId)]);
      setMovie(mRes.data);
      setShows(sRes.data || []);
    } catch (e) { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const toStr = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.substring(0,10);
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };

  const getShowDate = (show) => show.date ? show.date.substring(0,10) : (show.startTime ? show.startTime.substring(0,10) : '');

  const filteredShows = shows.filter(s => !selectedDate || getShowDate(s) === toStr(selectedDate));

  const groupedShows = filteredShows.reduce((acc, show) => {
    const id = show.theatreId || 'unknown';
    if (!acc[id]) acc[id] = { theatre:{ theatreId:show.theatreId, name:show.theatreName, location:show.theatreLocation||'' }, shows:[] };
    acc[id].shows.push(show);
    return acc;
  }, {});

  const isQuickPick = selectedDate && dateOptions.some(d => toStr(d) === toStr(selectedDate));
  const isCustom    = selectedDate && !isQuickPick;

  const handleCalendarToggle = useCallback(() => setCalendarOpen(o => !o), []);
  const handleCalendarClose  = useCallback(() => setCalendarOpen(false), []);

  if (loading) return <Container className="d-flex justify-content-center align-items-center" style={{minHeight:'60vh'}}><Spinner animation="border" variant="danger"/></Container>;
  if (error || !movie) return <Container className="mt-5"><Alert variant="danger">{error||"Movie not found"}</Alert></Container>;

  return (
    <div className="theatre-selection-page">

      {/* Movie header removed as per request */}


      <Container className="py-4">

        {/* ── Date Row ── */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', flexWrap:'nowrap', overflowX:'auto', paddingBottom:'4px' }}>

          {/* 7 quick-pick chips */}
          {dateOptions.map((date, idx) => {
            const sel = toStr(date) === toStr(selectedDate);
            return (
              <button key={idx} onClick={() => setSelectedDate(date)} style={{
                minWidth:'68px', flexShrink:0, cursor:'pointer',
                backgroundColor: sel ? '#e63946' : 'var(--card-bg,#fff)',
                color: sel ? '#fff' : 'var(--text-primary,#222)',
                border: sel ? 'none' : '1px solid #ddd',
                borderRadius:'10px', padding:'8px 6px', textAlign:'center',
                transition:'all 0.2s', fontFamily:'inherit', outline:'none',
                boxShadow: sel ? '0 4px 12px rgba(230,57,70,0.35)' : '0 1px 4px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'700', opacity: sel?1:0.6 }}>
                  {date.toLocaleString('default',{month:'short'}).toUpperCase()}
                </div>
                <div style={{ fontWeight:'bold', fontSize:'1.2rem', lineHeight:'1.2' }}>{date.getDate()}</div>
                <div style={{ fontSize:'0.6rem', fontWeight:'700', opacity: sel?0.9:0.5 }}>
                  {idx===0?'TODAY':date.toLocaleString('default',{weekday:'short'}).toUpperCase()}
                </div>
              </button>
            );
          })}

          {/* Custom date chip (only when outside 7 days) */}
          {isCustom && (
            <button style={{
              minWidth:'68px', flexShrink:0, cursor:'pointer',
              backgroundColor:'#e63946', color:'#fff', border:'none',
              borderRadius:'10px', padding:'8px 6px', textAlign:'center',
              boxShadow:'0 4px 12px rgba(230,57,70,0.35)', fontFamily:'inherit', outline:'none'
            }}>
              <div style={{ fontSize:'0.65rem', fontWeight:'700' }}>
                {selectedDate.toLocaleString('default',{month:'short'}).toUpperCase()}
              </div>
              <div style={{ fontWeight:'bold', fontSize:'1.2rem', lineHeight:'1.2' }}>{selectedDate.getDate()}</div>
              <div style={{ fontSize:'0.6rem', fontWeight:'700', opacity:0.9 }}>
                {selectedDate.toLocaleString('default',{weekday:'short'}).toUpperCase()}
              </div>
            </button>
          )}

          {/* Calendar picker button */}
          <button
            ref={calendarBtnRef}
            onClick={handleCalendarToggle}
            title="Pick any date"
            style={{
              flexShrink:0, width:'52px', height:'72px', cursor:'pointer',
              backgroundColor: calendarOpen ? '#fff0f1' : 'var(--card-bg,#fff)',
              color: calendarOpen ? '#e63946' : '#888',
              border: `2px solid ${calendarOpen ? '#e63946' : '#ddd'}`,
              borderRadius:'10px',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px',
              transition:'all 0.2s', fontFamily:'inherit', outline:'none',
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize:'0.55rem', fontWeight:'800', letterSpacing:'0.5px' }}>MORE</span>
          </button>

          {/* Calendar Popup — rendered via portal to escape overflow:hidden */}
          {calendarOpen && (
            <CalendarPicker
              anchorRef={calendarBtnRef}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onClose={handleCalendarClose}
            />
          )}
        </div>

        {/* ── Shows ── */}
        <div className="p-4 rounded shadow-sm" style={{ backgroundColor:'var(--card-bg,#fff)' }}>
          {Object.values(groupedShows).length === 0 ? (
            <Alert variant="info">
              No shows available for{' '}
              <strong>
                {selectedDate
                  ? selectedDate.toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric'})
                  : 'this date'}
              </strong>.
              <br/>
              <small className="text-muted">Try another date or use the calendar icon (MORE) to pick any date.</small>
            </Alert>
          ) : (
            Object.values(groupedShows).map((group, idx) => (
              <div key={idx} className="py-3" style={{ borderBottom: idx < Object.values(groupedShows).length-1 ? '1px solid #eee' : 'none' }}>
                <Row className="align-items-center">
                  <Col md={3}>
                    <h5 style={{ fontWeight:'600', color:'var(--text-primary)' }}>
                      {group.theatre?.name || "Unknown Theatre"}
                    </h5>
                    <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }} className="mb-0">
                      {group.theatre?.location}
                    </p>
                  </Col>
                  <Col md={9}>
                    <div className="d-flex flex-wrap gap-3 mt-3 mt-md-0">
                      {group.shows.map(show => (
                        <Link key={show.showId} to={`/seatlayout/${show.showId}`}
                          style={{
                            minWidth:'110px', borderRadius:'6px',
                            border:'1px solid #4CAF50', backgroundColor:'transparent',
                            textDecoration:'none', color:'#4CAF50',
                            padding:'8px 12px', textAlign:'center', display:'block',
                            fontWeight:'700', transition:'all 0.15s'
                          }}
                        >
                          <div style={{ fontSize:'1rem' }}>
                            {show.startTime
                              ? new Date(show.startTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
                              : 'TBD'}
                          </div>
                          <div style={{ fontSize:'0.72rem', opacity:0.75 }}>
                            {show.screenNumber ? `Screen ${show.screenNumber}` : 'Screen'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Col>
                </Row>
              </div>
            ))
          )}
        </div>
      </Container>
    </div>
  );
};

export default TheatreSelectionPage;
