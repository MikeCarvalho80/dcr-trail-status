import { useState } from "react";

const PARKS = [
  {
    id: "neponset",
    name: "Neponset River Reservation",
    region: "South",
    manager: "DCR",
    distance: "5 min",
    url: "https://www.mass.gov/locations/neponset-river-reservation",
    lat: 42.2530,
    lng: -71.1050,
    parking: "Burma Trail Parking, 1339 Brush Hill Rd, Milton",
    closureType: "advisory",
    closureRule: "No formal closure — unmarked trails, ride at your own risk",
    closureStart: null,
    closureEnd: null,
    notes: "Right in Hyde Park. Largely wild with tight, unmarked, highly technical trails. A fire road runs north-south as the spine. Not an official MTB destination but rideable.",
    difficulty: "Intermediate-Advanced",
    miles: "5+",
    nemba: "N/A",
  },
  {
    id: "blue-hills",
    name: "Blue Hills Reservation",
    region: "South",
    manager: "DCR",
    distance: "10 min",
    url: "https://www.mass.gov/location-details/mountain-biking-in-blue-hills",
    lat: 42.2163,
    lng: -71.1086,
    parking: "Houghton's Pond, 840 Hillside St, Milton",
    closureType: "formal",
    closureRule: "March 1 - March 31 (DCR mandate)",
    closureStart: { month: 3, day: 1 },
    closureEnd: { month: 3, day: 31 },
    notes: "Trails east of Rte 28 permanently closed (endangered species). Sections: Great Blue Hill, Houghton's Pond, Ponkapoag, West St, Little Blue Hill, Fowl Meadow.",
    difficulty: "Intermediate-Advanced",
    miles: "35+",
    nemba: "SE Mass",
  },
  {
    id: "stony-brook",
    name: "Stony Brook Reservation",
    region: "South",
    manager: "DCR",
    distance: "15 min",
    url: "https://www.mass.gov/locations/stony-brook-reservation",
    lat: 42.2720,
    lng: -71.1290,
    parking: "Turtle Pond Pkwy, Hyde Park/Milton",
    closureType: "advisory",
    closureRule: "No formal spring closure",
    closureStart: null,
    closureEnd: null,
    notes: "One of the most diverse riding areas near Boston. Something for every rider, excellent for first-timers. Milton/Hyde Park border.",
    difficulty: "Beginner-Intermediate",
    miles: "8+",
    nemba: "Greater Boston",
  },
  {
    id: "cutler",
    name: "Cutler Park Reservation",
    region: "West",
    manager: "DCR",
    distance: "25 min",
    url: "https://www.mass.gov/locations/cutler-park-reservation",
    lat: 42.2980,
    lng: -71.2365,
    parking: "84 Kendrick St, Needham",
    closureType: "advisory",
    closureRule: "No formal spring closure",
    closureStart: null,
    closureEnd: null,
    notes: "700 acres in Needham/Dedham along Charles River. Singletrack, boardwalks through marshland, pump track. Connects to Riverdale Park, Millennium Park, Brook Farm. Boardwalks recently restored by NEMBA/DCR.",
    difficulty: "Beginner-Intermediate",
    miles: "9+",
    nemba: "SE Mass / Greater Boston",
  },
  {
    id: "needham-tf",
    name: "Needham Town Forest (High Rock)",
    region: "West",
    manager: "Town of Needham",
    distance: "30 min",
    url: "https://www.trailforks.com/region/needham-town-forest/",
    lat: 42.2780,
    lng: -71.2540,
    parking: "Charles River St trailhead, Needham",
    closureType: "advisory",
    closureRule: "No formal closure",
    closureStart: null,
    closureEnd: null,
    notes: "11 miles of fun, challenging trails. Former Boston Cup MTB race site. No massive climbs, just technical fun in every direction. Pairs well with Cutler Park.",
    difficulty: "Intermediate-Advanced",
    miles: "11+",
    nemba: "Greater Boston",
  },
  {
    id: "fells",
    name: "Middlesex Fells Reservation",
    region: "North",
    manager: "DCR",
    distance: "30 min",
    url: "https://www.mass.gov/location-details/mountain-biking-at-the-middlesex-fells",
    lat: 42.4530,
    lng: -71.1040,
    parking: "Bellevue Pond parking, South Border Rd, Medford",
    closureType: "formal",
    closureRule: "March 1 - March 31 or as posted (DCR mandate)",
    closureStart: { month: 3, day: 1 },
    closureEnd: { month: 3, day: 31 },
    notes: "Fire roads in Lawrence Woods and Eastern Fells. MTB Loop (green, 85% fire road) and Reservoir Trail (orange, 70% singletrack) in Western Fells. Long Pond and Virginia Wood always closed to bikes. 'Or as posted' means closure can extend.",
    difficulty: "Easy-Moderate",
    miles: "15+",
    nemba: "Greater Boston",
  },
  {
    id: "wompatuck",
    name: "Wompatuck State Park",
    region: "South",
    manager: "DCR",
    distance: "35 min",
    url: "https://www.mass.gov/locations/wompatuck-state-park",
    lat: 42.2270,
    lng: -70.8610,
    parking: "204 Union St, Hingham",
    closureType: "advisory",
    closureRule: "No formal spring closure — paved network year-round",
    closureStart: null,
    closureEnd: null,
    notes: "Former WWII ammo depot in Hingham. 12 miles paved plus extensive singletrack. Paved network means you can always ride something even in mud season.",
    difficulty: "Beginner-Intermediate",
    miles: "12+ paved",
    nemba: "SE Mass",
  },
  {
    id: "lynn-woods",
    name: "Lynn Woods Reservation",
    region: "North",
    manager: "City of Lynn",
    distance: "35 min",
    url: "https://visitlynnwoods.org/",
    lat: 42.4850,
    lng: -70.9830,
    parking: "Main entrance, Pennybrook Rd, Lynn",
    closureType: "formal",
    closureRule: "No biking during winter (city rule) — reopens in spring",
    closureStart: { month: 12, day: 1 },
    closureEnd: { month: 3, day: 31 },
    notes: "2,200 acres, 30+ miles. Second largest municipal park in the US. Terrain is ROCKS: slabs, boulders, ledge everywhere. Not for beginners. Check with rangers for exact reopening date. Not DCR managed.",
    difficulty: "Advanced-Expert",
    miles: "30+",
    nemba: "North Shore",
  },
  {
    id: "harold-parker",
    name: "Harold Parker State Forest",
    region: "North",
    manager: "DCR",
    distance: "45 min",
    url: "https://www.mass.gov/locations/harold-parker-state-forest",
    lat: 42.6130,
    lng: -71.0540,
    parking: "Jenkins Rd parking (Gate 13), Andover",
    closureType: "advisory",
    closureRule: "No formal spring closure",
    closureStart: null,
    closureEnd: null,
    notes: "3,000+ acres in Andover. 35+ miles, 11 ponds. Yellow Diamond Trail is a standout. Ranges from buffed singletrack to very technical. Hunting allowed in season (not Sundays).",
    difficulty: "Intermediate-Advanced",
    miles: "35+",
    nemba: "Merrimack Valley",
  },
  {
    id: "great-brook",
    name: "Great Brook Farm State Park",
    region: "NW",
    manager: "DCR",
    distance: "50 min",
    url: "https://www.mass.gov/locations/great-brook-farm-state-park",
    lat: 42.5480,
    lng: -71.3510,
    parking: "984 Lowell Rd, Carlisle",
    closureType: "seasonal",
    closureRule: "Winter: trails for XC skiing (Dec-Mar). Biking resumes spring.",
    closureStart: { month: 12, day: 1 },
    closureEnd: { month: 3, day: 15 },
    notes: "1,000 acres in Carlisle. Working dairy farm with ice cream stand. 20+ miles. Best family/beginner MTB in MA. Avoid nice summer weekends (very popular with families). Trails west of Lowell St open to non-skiers in winter.",
    difficulty: "Beginner-Intermediate",
    miles: "20+",
    nemba: "Merrimack Valley",
  },
  {
    id: "vietnam",
    name: "Vietnam (Milford)",
    region: "SW",
    manager: "Town of Milford",
    distance: "50 min",
    url: "https://www.nemba.org/trails/massachusetts/vietnam",
    lat: 42.1580,
    lng: -71.5260,
    parking: "Louisa Lake Rd trailhead, Milford",
    closureType: "advisory",
    closureRule: "Town land — no formal closure, self-policed mud season",
    closureStart: null,
    closureEnd: null,
    notes: "NEMBA-managed. Rocky, technical, the real deal. Has a reputation among Boston riders. Check NEMBA forums for conditions before driving out.",
    difficulty: "Intermediate-Expert",
    miles: "20+",
    nemba: "SE Mass",
  },
];

function getNavUrl(park) {
  return `https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&travelmode=driving`;
}

function getTrailStatus(park) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (!park.closureStart) {
    if (month === 3 || (month === 4 && day <= 10)) {
      return { status: "caution", label: "Mud Season", sublabel: "No formal closure — use judgment on wet trails" };
    }
    return { status: "open", label: "Likely Open", sublabel: "No formal spring closure" };
  }

  let inClosure = false;
  if (park.closureStart.month > park.closureEnd.month) {
    inClosure = month >= park.closureStart.month || month < park.closureEnd.month ||
      (month === park.closureEnd.month && day <= park.closureEnd.day);
  } else {
    inClosure =
      (month > park.closureStart.month || (month === park.closureStart.month && day >= park.closureStart.day)) &&
      (month < park.closureEnd.month || (month === park.closureEnd.month && day <= park.closureEnd.day));
  }

  if (inClosure) {
    const year = now.getFullYear();
    let endDate;
    if (park.closureStart.month > park.closureEnd.month && month >= park.closureStart.month) {
      endDate = new Date(year + 1, park.closureEnd.month - 1, park.closureEnd.day);
    } else {
      endDate = new Date(year, park.closureEnd.month - 1, park.closureEnd.day);
    }
    const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    let sublabel = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`;
    if (park.closureType === "formal") sublabel += " (mandatory)";
    if (park.closureType === "seasonal") sublabel += " (seasonal use)";
    if (park.closureRule.includes("as posted")) sublabel += " — may extend";
    return { status: "closed", label: "Closed", sublabel };
  }

  if (
    (month === park.closureEnd.month && day > park.closureEnd.day) ||
    (month === park.closureEnd.month + 1 && day <= 14)
  ) {
    if (park.closureType === "formal") {
      return { status: "caution", label: "Recently Reopened", sublabel: "Check for posted extensions before riding" };
    }
    return { status: "open", label: "Open", sublabel: "Season underway" };
  }

  return { status: "open", label: "Open", sublabel: "No active restrictions" };
}

const STATUS_CONFIG = {
  open: { bg: "#0a2e1a", border: "#1a7a45", dot: "#2ecc71", text: "#2ecc71" },
  caution: { bg: "#2e2a0a", border: "#7a6c1a", dot: "#f1c40f", text: "#f1c40f" },
  warning: { bg: "#2e1a0a", border: "#7a4a1a", dot: "#e67e22", text: "#e67e22" },
  closed: { bg: "#2e0a0a", border: "#7a1a1a", dot: "#e74c3c", text: "#e74c3c" },
};

function StatusDot({ status, size = 10 }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      backgroundColor: c.dot, boxShadow: `0 0 ${size}px ${c.dot}55`,
      animation: status === "closed" ? "pulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

function NavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function ParkCard({ park }) {
  const [expanded, setExpanded] = useState(false);
  const trail = getTrailStatus(park);
  const c = STATUS_CONFIG[trail.status];

  return (
    <div
      style={{
        background: c.bg, border: `1px solid ${c.border}44`, borderRadius: 12,
        padding: "14px 18px", marginBottom: 8, cursor: "pointer", transition: "all 0.2s ease",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <StatusDot status={trail.status} size={8} />
            <span style={{ fontFamily: "monospace", fontSize: 11, color: c.text, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {trail.label}
            </span>
            <span style={{ fontSize: 10, color: "#4a4840", fontFamily: "monospace", background: "#1a1915", padding: "1px 6px", borderRadius: 4 }}>
              {park.manager}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e8e6e1" }}>{park.name}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6a6860", fontFamily: "monospace" }}>{trail.sublabel}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0, marginLeft: 12 }}>
          <span style={{ fontSize: 10, color: "#5a5850", fontFamily: "monospace" }}>{park.distance}</span>
          <span style={{ fontSize: 10, color: "#4a4840", fontFamily: "monospace" }}>{park.miles} mi</span>
          <span style={{ fontSize: 13, color: "#4a4840", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.border}33` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "#5a5850", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2, fontFamily: "monospace" }}>Policy</div>
              <div style={{ fontSize: 11, color: "#a0a098", fontFamily: "monospace", lineHeight: 1.4 }}>{park.closureRule}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#5a5850", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2, fontFamily: "monospace" }}>Difficulty</div>
              <div style={{ fontSize: 11, color: "#a0a098", fontFamily: "monospace" }}>{park.difficulty}</div>
              <div style={{ fontSize: 10, color: "#5a5850", fontFamily: "monospace" }}>NEMBA: {park.nemba}</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#7a7870", lineHeight: 1.5, fontFamily: "monospace", marginBottom: 10 }}>{park.notes}</div>

          <div style={{ fontSize: 10, color: "#5a5850", fontFamily: "monospace", marginBottom: 10 }}>
            Parking: {park.parking}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href={getNavUrl(park)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 11,
                fontFamily: "monospace",
                fontWeight: 600,
                color: "#0d0c0a",
                background: c.text,
                borderRadius: 6,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <NavIcon /> Navigate
            </a>
            <a
              href={park.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: 11,
                fontFamily: "monospace",
                color: c.text,
                background: "transparent",
                border: `1px solid ${c.text}44`,
                borderRadius: 6,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Official page
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function SeasonTimeline() {
  const now = new Date();
  const year = now.getFullYear();
  const mar1 = new Date(year, 2, 1);
  const mar31 = new Date(year, 2, 31);
  const apr14 = new Date(year, 3, 14);
  const total = apr14 - mar1;
  const elapsed = Math.max(0, Math.min(now - mar1, total));
  const pct = (elapsed / total) * 100;
  const closureEnd = ((mar31 - mar1) / total) * 100;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, color: "#5a5850", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, fontFamily: "monospace" }}>
        DCR Mandatory Closure Timeline
      </div>
      <div style={{ position: "relative", height: 6, background: "#1a1915", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${closureEnd}%`, background: "#e74c3c33" }} />
        <div style={{ position: "absolute", left: `${closureEnd}%`, top: 0, height: "100%", width: `${100 - closureEnd}%`, background: "#f1c40f22" }} />
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`,
          background: pct <= closureEnd ? "#e74c3c" : "#2ecc71", borderRadius: 3,
          boxShadow: `0 0 6px ${pct <= closureEnd ? "#e74c3c" : "#2ecc71"}55`,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 9, color: "#e74c3c88", fontFamily: "monospace" }}>Mar 1</span>
        <span style={{ fontSize: 9, color: "#f1c40f88", fontFamily: "monospace" }}>Apr 1 check posts</span>
        <span style={{ fontSize: 9, color: "#2ecc7188", fontFamily: "monospace" }}>Apr 14 safe</span>
      </div>
    </div>
  );
}

export default function App() {
  const [region, setRegion] = useState("All");
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const regions = ["All", "South", "North", "West", "NW", "SW"];
  const filtered = region === "All" ? PARKS : PARKS.filter((p) => p.region === region);

  const counts = { closed: 0, caution: 0, open: 0 };
  filtered.forEach((p) => {
    const s = getTrailStatus(p).status;
    if (s === "closed") counts.closed++;
    else if (s === "caution") counts.caution++;
    else counts.open++;
  });

  const sorted = [...filtered].sort((a, b) => {
    const order = { closed: 0, caution: 1, warning: 2, open: 3 };
    return order[getTrailStatus(a).status] - order[getTrailStatus(b).status];
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0d0c0a", color: "#e8e6e1", padding: "24px 16px", maxWidth: 640, margin: "0 auto" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "#4a4840", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>MTB Trail Status</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>Spring Restriction Monitor</h1>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#4a4840", fontFamily: "monospace" }}>
          {dateStr} · {PARKS.length} parks within 1hr of Hyde Park
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { n: counts.closed, label: "Closed", color: "#e74c3c" },
          { n: counts.caution, label: "Caution", color: "#f1c40f" },
          { n: counts.open, label: "Open", color: "#2ecc71" },
        ].map(({ n, label, color }) => (
          <div key={label} style={{ flex: 1, background: "#12110e", border: "1px solid #1a1915", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace" }}>{n}</div>
            <div style={{ fontSize: 9, color: "#5a5850", fontFamily: "monospace", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      <SeasonTimeline />

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {regions.map((r) => (
          <button key={r} onClick={() => setRegion(r)} style={{
            padding: "3px 10px", fontSize: 10, fontFamily: "monospace", cursor: "pointer",
            background: region === r ? "#2a2820" : "transparent",
            color: region === r ? "#e8e6e1" : "#5a5850",
            border: `1px solid ${region === r ? "#3a3830" : "#1a1915"}`,
            borderRadius: 5,
          }}>
            {r}
          </button>
        ))}
      </div>

      {sorted.map((park) => <ParkCard key={park.id} park={park} />)}

      <div style={{ background: "#12110e", border: "1px solid #1a1915", borderRadius: 10, padding: "12px 16px", marginTop: 16 }}>
        <div style={{ fontSize: 9, color: "#5a5850", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4, fontFamily: "monospace" }}>Status Logic</div>
        <div style={{ fontSize: 11, color: "#5a5850", lineHeight: 1.5, fontFamily: "monospace" }}>
          DCR parks with formal March closures (Blue Hills, Fells): calendar-based, mandatory. "Or as posted" at the Fells means staff can extend past 3/31. Lynn Woods: City of Lynn bans winter biking, reopens in spring. Great Brook: winter XC ski operations close trails to bikes. All others: mud season advisory March through early April. Navigate links open Google Maps directions to each park's main MTB parking lot.
        </div>
      </div>

      <div style={{ marginTop: 16, padding: "8px 0", borderTop: "1px solid #1a1915", textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#3a3830", fontFamily: "monospace" }}>
          Ride responsibly · Respect mud season · Stay off wet trails · Support NEMBA
        </div>
      </div>
    </div>
  );
}
