import { useState, useRef, useEffect } from 'react';
import leoImg from '../../assets/leo.png';
import {
  filterFacts, aggregateByDepartment, aggregateByProvider,
  aggregateByServiceType, aggregateByMonth, computeKPIs,
} from '../../data/mockData';

// aici construiesc o singura data contextul financiar pe care il trimit la AI
// adun toate datele din mock pentru 2025 si 2024 ca sa aiba Leo pe ce sa se bazeze
const _f25  = filterFacts({ year: '2025' });
const _f24  = filterFacts({ year: '2024' });
const _kpis = computeKPIs(_f25, _f24);
const _dept = aggregateByDepartment(_f25);
const _prov = aggregateByProvider(_f25);
const _svc  = aggregateByServiceType(_f25);
const _luni = aggregateByMonth(_f25, '2025');

const FINANCIAL_CONTEXT = JSON.stringify({
  buget_lunar_ron:    33000,
  cost_total_2025:    _kpis.totalNet,
  cost_total_2024:    Math.round(_f24.reduce((s, f) => s + f.net_cost, 0)),
  variatie_anuala:    `${_kpis.deltaVsPrev}%`,
  discount_total_ron: _kpis.totalDiscount,
  servicii_active:    _kpis.activeServices,
  departamente:       _dept.map(d => ({ nume: d.name, cost_net_ron: d.netCost })),
  provideri:          _prov.map(p => ({ provider: p.name, cost_net_ron: p.netCost, economii_ron: p.discounts })),
  tipuri_servicii:    _svc.map(s => ({ tip: s.name, cost_ron: s.value })),
  costuri_lunare:     _luni.map(l => ({ luna: l.month, cost_net_ron: l.netCost })),
  luni_depasit_buget: _luni.filter(l => l.netCost > 33000).map(l => l.month),
});

const SYSTEM_TEXT =
  `Ești Leo, un asistent virtual de FinOps sub forma unui motan inteligent. ` +
  `Rolul tău este de consultant financiar senior. ` +
  `Răspunde exclusiv în limba română, profesionist, analitic, cu un subtil farmec felin (un singur 🐾 la final). ` +
  `REGULĂ STRICTĂ: Răspunsurile tale trebuie să fie foarte SCURTE, ușor de scanat și perfect adaptate pentru o fereastră mică de chat. ` +
  `NU scrie eseuri. Oferă maximum 2-3 idei principale sau bullet points scurte. ` +
  `După ce oferi un scurt rezumat, întreabă întotdeauna utilizatorul dacă dorește să aprofundeze un anumit aspect ` +
  `(ex: un departament anume, resurse inactive, etc). ` +
  `Bazează-te STRICT pe aceste date: ${FINANCIAL_CONTEXT}`;

// iconitele  desenate cu svg, una de trimitere si una de inchidere
const IconSend = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
  </svg>
);
const IconClose = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

// avatarele
function LeoAvatar({ size = 'md' }) {
  const cls = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  return (
    <img
      src={leoImg}
      alt="Leo"
      className={`${cls} rounded-full object-cover flex-shrink-0`}
    />
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center
                    flex-shrink-0 text-white text-[10px] font-bold">
      TU
    </div>
  );
}

// componenta principala a chat-ului
// primesc onNavigate de la TopBar ca sa pot schimba ecranul activ direct din chat
function FinOpsCopilot({ open, onClose, onNavigate }) {
  const now = () => new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  const [messages, setMessages] = useState([{
    id:   1,
    role: 'ai',
    text: 'Salut! Sunt Leo, motanul care te ajută să-ți ții leii în companie, nu să-i risipești prin cloud! Cu ce te pot ajuta astăzi? 🐾',
    time: now(),
  }]);
  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    // adaug imediat mesajul utilizatorului in lista ca sa apara pe ecran
    const userMsg = { id: Date.now(), role: 'user', text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // verific cheia API inainte de try, ca sa nu arunc o eroare care sare direct in catch
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('DEBUG ERROR: VITE_GEMINI_API_KEY is not set. Add it to .env.local and restart Vite.');
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'ai',
        text: 'Miau... cheia API lipsește. Adaugă VITE_GEMINI_API_KEY în fișierul .env.local și repornește serverul. 🔑',
        time: now(),
      }]);
      setIsTyping(false);
      return;                        // ies din functie inainte de try, fara throw
    }

    try {
      // construiesc istoricul conversatiei pentru Gemini
      // sar peste mesajul de bun venit (primul) si transform 'ai' in 'model' cum cere API-ul
      const history = [...messages.slice(1), userMsg].map(m => ({
        role:  m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      // Gemini cere ca lista sa se termine cu un mesaj de la 'user'
      const contents = history.length > 0 ? history : [{ role: 'user', parts: [{ text }] }];

      const endpoint =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: SYSTEM_TEXT },
          },
          contents,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} - ${errBody}`);
      }

      const data  = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        ?? 'Nu am primit un răspuns valid de la server.';

      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'ai',
        text: reply,
        time: now(),
      }]);
    } catch (error) {
      console.error('DEBUG ERROR:', error, error.message, error.stack);
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'ai',
        text: 'Miau... o eroare de rețea. Verifică setările API. 🐾',
        time: now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // functia pentru butonul "Vezi Waste Finder"
  // mai intai navighez la ecranul de optimizare, inchid chat-ul
  // apoi am folosit un scurt timeout ca sa fiu sigur ca a aparut componenta
  // inainte sa fac scroll pana la sectiunea waste-finder
  const handleGoToWasteFinder = () => {
    if (onNavigate) onNavigate('optimization');
    onClose();
    setTimeout(() => {
      const el = document.getElementById('waste-finder-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  return (
    <>
      {/* fundalul intunecat din spate, se inchide la click */}
      <div
        className={[
          'fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] z-[59] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* panoul care aluneca din dreapta */}
      <div
        className={[
          'fixed top-0 right-0 h-screen w-[390px] z-[60] bg-white shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* antetul cu avatarul lui Leo si statusul */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="relative">
            <LeoAvatar size="lg" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500
                             border-2 border-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">Leo - Asistent AI</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Activ • FinOps RO</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100
                             text-[9px] font-bold text-blue-600 uppercase tracking-wide">
              Gemini
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100
                         transition-colors duration-150"
              aria-label="Închide"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* o bara mica galbena care arata ce date sunt active */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2 flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span className="text-xs text-amber-700 font-medium">
            Date active: 2025 · Buget 33.000 RON/lună
          </span>
        </div>

        {/* zona cu mesajele, se deruleaza pe verticala */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'ai' ? <LeoAvatar size="sm" /> : <UserAvatar />}

              <div className="flex flex-col gap-1 max-w-[82%]">
                <div className={[
                  'rounded-2xl px-4 py-2.5 text-xs leading-relaxed',
                  msg.role === 'ai'
                    ? 'bg-slate-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm',
                ].join(' ')}>
                  {msg.text}
                </div>
                <span className={`text-[10px] text-gray-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* punctuletele care sar cat timp Leo "scrie" */}
          {isTyping && (
            <div className="flex gap-2.5 flex-row">
              <LeoAvatar size="sm" />
              <div className="bg-slate-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3.5">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: '160ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: '320ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* sugestii rapide, le arat doar la inceput cand e un singur mesaj */}
        {messages.length === 1 && !isTyping && (
          <div className="px-4 pb-3 flex flex-col gap-2 flex-shrink-0">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Sugestii rapide</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Care e costul total 2025?',
                'Resurse inactive?',
                'Prognoză 2026',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-gray-200
                             text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-200
                             hover:text-blue-700 transition-all duration-150"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* buton special de navigare - nu trimite mesaj in chat,
                ci muta direct utilizatorul pe ecranul de Optimizare
                si face scroll pana la sectiunea Waste Finder */}
            <button
              onClick={handleGoToWasteFinder}
              className="flex items-center gap-2 px-3 py-2 rounded-lg w-full
                         bg-red-50 border border-red-200 text-red-600
                         text-xs font-semibold hover:bg-red-100
                         transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Vezi Waste Finder
              <span className="ml-auto text-red-400 font-normal">→ Optimizare</span>
            </button>
          </div>
        )}

        {/* zona de scriere a mesajului si butonul de trimitere */}
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-2 items-end bg-slate-50 border border-gray-200
                          rounded-xl px-4 py-3 focus-within:border-blue-300
                          focus-within:bg-white transition-colors duration-150">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrie un mesaj pentru Leo…"
              rows={1}
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none resize-none
                         placeholder:text-gray-400 leading-relaxed max-h-24 overflow-y-auto
                         disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center
                         justify-center disabled:opacity-40 hover:bg-blue-700
                         transition-colors duration-150 flex-shrink-0"
              aria-label="Trimite"
            >
              <IconSend />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2.5">
            Răspunsurile sunt generate de Gemini 2.5 Flash · Lucrare de licență 2026
          </p>
        </div>
      </div>
    </>
  );
}

export default FinOpsCopilot;
