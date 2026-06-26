// logo-ul meu desenat manual cu svg: motanul Leo, mascota aplicatiei
// primeste className ca sa-i pot schimba marimea de unde il folosesc
function MascotLogo({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Leo - Mascota FinOps RO"
    >
      {/* urechile, conturul si interiorul mai deschis */}
      <polygon points="18,48 16,10 40,30" fill="#f97316" />
      <polygon points="82,48 84,10 60,30" fill="#f97316" />
      <polygon points="22,44 21,18 37,30" fill="#fb923c" />
      <polygon points="78,44 79,18 63,30" fill="#fb923c" />

      {/* capul */}
      <circle cx="50" cy="60" r="36" fill="#f97316" />

      {/* obrajii imbujorati */}
      <circle cx="26" cy="70" r="9" fill="#fb923c" opacity="0.55" />
      <circle cx="74" cy="70" r="9" fill="#fb923c" opacity="0.55" />

      {/* ochiul stang */}
      <circle cx="37" cy="56" r="8" fill="#1e1b4b" />
      <circle cx="37" cy="56" r="4.5" fill="#312e81" />
      <circle cx="34.5" cy="53.5" r="2.5" fill="white" />
      <circle cx="39" cy="58" r="1" fill="white" opacity="0.6" />

      {/* ochiul drept */}
      <circle cx="63" cy="56" r="8" fill="#1e1b4b" />
      <circle cx="63" cy="56" r="4.5" fill="#312e81" />
      <circle cx="60.5" cy="53.5" r="2.5" fill="white" />
      <circle cx="65" cy="58" r="1" fill="white" opacity="0.6" />

      {/* nasul */}
      <polygon points="50,67 46,73 54,73" fill="#c2410c" />

      {/* gurita */}
      <path
        d="M44,75 Q50,82 56,75"
        stroke="#c2410c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* mustatile din stanga */}
      <line x1="6"  y1="66" x2="40" y2="70" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="6"  y1="74" x2="40" y2="72" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="10" y1="58" x2="38" y2="66" stroke="white" strokeWidth="1.2" opacity="0.4" />

      {/* mustatile din dreapta */}
      <line x1="94" y1="66" x2="60" y2="70" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="94" y1="74" x2="60" y2="72" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="90" y1="58" x2="62" y2="66" stroke="white" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

export default MascotLogo;
