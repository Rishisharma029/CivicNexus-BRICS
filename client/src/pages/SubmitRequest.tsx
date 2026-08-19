import RequestMap from "@/components/RequestMap";
import { Button } from "@/components/ui/button";
import { BRICS_COUNTRIES, CATEGORIES, LANGUAGES, categoryLabel, countryName } from "@/lib/civic";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, CheckCircle2, ChevronRight, FileAudio, Loader2, MapPin, Mic, ShieldCheck, Sparkles, Sprout, Square, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type Country = (typeof BRICS_COUNTRIES)[number]["code"];
type Category = (typeof CATEGORIES)[number]["value"];
type Language = (typeof LANGUAGES)[number]["code"];
type Urgency = "low" | "medium" | "high" | "critical";
type FarmerIssue = "crop_health" | "pests" | "irrigation" | "soil" | "weather" | "market_access" | "livestock";
type VoiceNote = { id: string; base64: string; mimeType: "audio/webm" | "audio/mpeg" | "audio/wav" | "audio/ogg" | "audio/mp4"; fileName: string; size: number; state: "transcribing" | "transcribed" | "failed"; audioUrl?: string; transcript?: string; error?: string };

const FORM_COPY: Record<Language, Record<string, string>> = {
  en: { eyebrow: "Citizen signal intake", heading: "Report the infrastructure gap you live with.", intro: "Your local knowledge becomes a protected, auditable signal for the public-interest decision system.", language: "Form language", country: "Country", category: "Infrastructure category", urgency: "Urgency", title: "Short title", description: "What is happening? Who is affected?", location: "Pin the precise location", pinHelp: "Click the map to pin a place. We use the location only to understand area-level demand.", submit: "Save request", signedOut: "Sign in to send a verified civic request", review: "Your request saves immediately. Optional AI classification, translation, and policy tracing run only from your protected request page." },
  hi: { eyebrow: "नागरिक संकेत", heading: "अपने क्षेत्र की बुनियादी ढाँचा समस्या दर्ज करें।", intro: "आपकी स्थानीय जानकारी सार्वजनिक हित के निर्णय तंत्र के लिए एक सुरक्षित और जाँच योग्य संकेत बनती है।", language: "फॉर्म की भाषा", country: "देश", category: "अवसंरचना श्रेणी", urgency: "तात्कालिकता", title: "संक्षिप्त शीर्षक", description: "क्या हो रहा है? कौन प्रभावित है?", location: "सटीक स्थान चिन्हित करें", pinHelp: "स्थान चिन्हित करने के लिए मानचित्र पर क्लिक करें।", submit: "AI समीक्षा के लिए भेजें", signedOut: "सत्यापित नागरिक अनुरोध भेजने के लिए साइन इन करें", review: "AI वर्गीकरण, अनुवाद और समान संकेतों की जाँच करेगा।" },
  ru: { eyebrow: "Сигнал гражданина", heading: "Сообщите о проблеме инфраструктуры в вашем районе.", intro: "Ваши местные знания становятся защищённым и проверяемым сигналом для общественно значимых решений.", language: "Язык формы", country: "Страна", category: "Категория инфраструктуры", urgency: "Срочность", title: "Краткий заголовок", description: "Что происходит? Кто затронут?", location: "Укажите точное место", pinHelp: "Нажмите на карту, чтобы отметить место.", submit: "Отправить на ИИ-проверку", signedOut: "Войдите, чтобы отправить подтверждённый запрос", review: "ИИ классифицирует, переведёт и найдёт похожие сигналы." },
  zh: { eyebrow: "公民信号提交", heading: "报告您身边的基础设施缺口。", intro: "您的本地知识将成为公共利益决策系统中受保护且可审计的信号。", language: "表单语言", country: "国家", category: "基础设施类别", urgency: "紧急程度", title: "简短标题", description: "发生了什么？谁受到影响？", location: "标记准确位置", pinHelp: "点击地图标记位置。", submit: "提交至 AI 审核", signedOut: "登录后可提交经验证的公民请求", review: "AI 将分类、翻译并识别重叠信号。" },
  pt: { eyebrow: "Sinal cidadão", heading: "Relate a lacuna de infraestrutura que você vivencia.", intro: "Seu conhecimento local se torna um sinal protegido e auditável para decisões de interesse público.", language: "Idioma do formulário", country: "País", category: "Categoria de infraestrutura", urgency: "Urgência", title: "Título curto", description: "O que está acontecendo? Quem é afetado?", location: "Marque o local preciso", pinHelp: "Clique no mapa para marcar um lugar.", submit: "Enviar para análise de IA", signedOut: "Entre para enviar uma solicitação cívica verificada", review: "A IA classificará, traduzirá e encontrará sinais sobrepostos." },
  ar: { eyebrow: "إشارة مواطن", heading: "أبلغ عن فجوة البنية التحتية التي تعيشها.", intro: "تتحول معرفتك المحلية إلى إشارة محمية وقابلة للتدقيق لنظام القرار ذي المصلحة العامة.", language: "لغة النموذج", country: "البلد", category: "فئة البنية التحتية", urgency: "مستوى الاستعجال", title: "عنوان قصير", description: "ما الذي يحدث؟ من المتأثر؟", location: "ثبّت الموقع الدقيق", pinHelp: "انقر على الخريطة لتحديد مكان.", submit: "إرسال لمراجعة الذكاء الاصطناعي", signedOut: "سجّل الدخول لإرسال طلب مدني موثق", review: "سيصنّف الذكاء الاصطناعي الإشارة ويترجمها ويكشف التداخلات." },
};

const FARM_COPY: Record<Language, { title: string; safety: string; enterprise: string; issue: string; stage: string; scale: string; placeholder: string; cropHealth: string; pests: string; irrigation: string; soil: string; weather: string; market: string; livestock: string; smallholder: string; small: string; medium: string; cooperative: string }> = {
  en: { title: "AI-Driven Farmer Advisory", safety: "Share farm context to receive safety-bounded multilingual guidance after saving. It never prescribes chemicals, doses, or treatment, and does not replace an accredited extension officer, veterinarian, or agronomist.", enterprise: "Crop, livestock, or enterprise", issue: "Issue type", stage: "Growth stage or production phase", scale: "Farm scale", placeholder: "e.g. rice, maize, dairy cattle", cropHealth: "Crop health", pests: "Pests", irrigation: "Irrigation", soil: "Soil", weather: "Weather risk", market: "Market access", livestock: "Livestock", smallholder: "Smallholder", small: "Small farm", medium: "Medium farm", cooperative: "Cooperative" },
  hi: { title: "एआई किसान सलाह", safety: "सहेजने के बाद सुरक्षित बहुभाषी मार्गदर्शन पाने के लिए खेत का संदर्भ साझा करें। यह रसायन, मात्रा या उपचार नहीं बताता और कृषि, पशु-चिकित्सा या विस्तार विशेषज्ञ का विकल्प नहीं है।", enterprise: "फसल, पशुधन या उद्यम", issue: "समस्या का प्रकार", stage: "विकास चरण या उत्पादन अवस्था", scale: "खेत का आकार", placeholder: "जैसे धान, मक्का, डेयरी पशु", cropHealth: "फसल स्वास्थ्य", pests: "कीट", irrigation: "सिंचाई", soil: "मिट्टी", weather: "मौसम जोखिम", market: "बाज़ार पहुंच", livestock: "पशुधन", smallholder: "लघु कृषक", small: "छोटा खेत", medium: "मध्यम खेत", cooperative: "सहकारी" },
  ru: { title: "ИИ-советник для фермеров", safety: "Укажите контекст хозяйства, чтобы после сохранения получить безопасную многоязычную рекомендацию. Она не назначает химикаты, дозировки или лечение и не заменяет специалиста по сельскому хозяйству, ветеринара или агронома.", enterprise: "Культура, животноводство или хозяйство", issue: "Тип проблемы", stage: "Стадия роста или производства", scale: "Масштаб хозяйства", placeholder: "например, рис, кукуруза, молочный скот", cropHealth: "Состояние культуры", pests: "Вредители", irrigation: "Орошение", soil: "Почва", weather: "Погодный риск", market: "Доступ к рынку", livestock: "Животноводство", smallholder: "Мелкое хозяйство", small: "Небольшая ферма", medium: "Средняя ферма", cooperative: "Кооператив" },
  zh: { title: "AI 农户咨询", safety: "填写农场情况，保存后可获得有安全边界的多语言建议。该工具不提供化学品、剂量或治疗方案，也不能替代农业推广员、兽医或农艺师。", enterprise: "作物、牲畜或农业经营", issue: "问题类型", stage: "生长阶段或生产阶段", scale: "农场规模", placeholder: "例如：水稻、玉米、奶牛", cropHealth: "作物健康", pests: "病虫害", irrigation: "灌溉", soil: "土壤", weather: "天气风险", market: "市场准入", livestock: "牲畜", smallholder: "小农户", small: "小型农场", medium: "中型农场", cooperative: "合作社" },
  pt: { title: "Assessoria de IA para Agricultores", safety: "Compartilhe o contexto da propriedade para receber orientação multilíngue com limites de segurança após salvar. A ferramenta não prescreve químicos, doses ou tratamentos e não substitui extensionista, veterinário ou agrônomo credenciado.", enterprise: "Cultura, criação ou atividade", issue: "Tipo de problema", stage: "Estágio de crescimento ou produção", scale: "Escala da propriedade", placeholder: "ex.: arroz, milho, gado leiteiro", cropHealth: "Saúde da cultura", pests: "Pragas", irrigation: "Irrigação", soil: "Solo", weather: "Risco climático", market: "Acesso ao mercado", livestock: "Pecuária", smallholder: "Agricultor familiar", small: "Pequena propriedade", medium: "Média propriedade", cooperative: "Cooperativa" },
  ar: { title: "إرشاد المزارعين بالذكاء الاصطناعي", safety: "شارك سياق المزرعة للحصول على إرشاد متعدد اللغات بحدود أمان بعد الحفظ. لا تصف الأداة مواد كيميائية أو جرعات أو علاجات ولا تحل محل المرشد الزراعي أو الطبيب البيطري أو المهندس الزراعي المعتمد.", enterprise: "المحصول أو الماشية أو النشاط", issue: "نوع المشكلة", stage: "مرحلة النمو أو الإنتاج", scale: "حجم المزرعة", placeholder: "مثل الأرز أو الذرة أو أبقار الألبان", cropHealth: "صحة المحصول", pests: "الآفات", irrigation: "الري", soil: "التربة", weather: "مخاطر الطقس", market: "الوصول إلى السوق", livestock: "الثروة الحيوانية", smallholder: "مزارع صغير", small: "مزرعة صغيرة", medium: "مزرعة متوسطة", cooperative: "تعاونية" },
};

export default function SubmitRequest() {
  const [location, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [form, setForm] = useState<{ country: Country; category: Category; urgency: Urgency; originalLanguage: Language; title: string; description: string; locationLabel: string; latitude: number; longitude: number; farmDetails: { cropOrLivestock: string; issueType: FarmerIssue; growthStage?: string; farmScale: "smallholder" | "small" | "medium" | "cooperative"; observedSince?: string } }>({
    country: "IN", category: location.includes("track=farmer") ? "agriculture" : "water", urgency: "medium", originalLanguage: "en", title: "", description: "", locationLabel: "", latitude: 28.6139, longitude: 77.209,
    farmDetails: { cropOrLivestock: "", issueType: "crop_health", growthStage: "", farmScale: "smallholder", observedSince: "" },
  });
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const copy = FORM_COPY[form.originalLanguage];
  const farmCopy = FARM_COPY[form.originalLanguage];
  const language = LANGUAGES.find(item => item.code === form.originalLanguage)!;
  const submit = trpc.civic.requests.submit.useMutation({
    onSuccess: result => {
      toast.success("Request saved immediately. You can start the optional AI analysis from its secure trace page.");
      navigate(`/signal/${result.requestId}`);
    },
    onError: error => toast.error(error.message),
  });
  const submitVoice = trpc.civic.requests.submitVoice.useMutation({
    onSuccess: result => {
      toast.success("Voice report saved. Your reviewed transcript and original voice note are in the secure trace.");
      navigate(`/signal/${result.requestId}`);
    },
    onError: error => toast.error(error.message),
  });
  const transcribeVoice = trpc.civic.requests.transcribeVoice.useMutation();
  const urgencyLabel = useMemo(() => ({ low: "Low", medium: "Medium", high: "High", critical: "Critical" }), []);

  const selectCountry = (country: Country) => {
    const entry = BRICS_COUNTRIES.find(item => item.code === country)!;
    setForm(current => ({ ...current, country, latitude: entry.capital.lat, longitude: entry.capital.lng, locationLabel: `${entry.name} regional reference point` }));
  };

  const setVoiceFile = (file: File) => {
    const supported = ["audio/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"] as const;
    if (!supported.includes(file.type as typeof supported[number])) return toast.error("Use WebM, MP3, WAV, OGG, or M4A audio.");
    if (file.size > 16 * 1024 * 1024) return toast.error("Voice notes must be 16 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => {
      const id = `${Date.now()}-${file.name}-${file.size}`;
      const note: VoiceNote = { id, base64: String(reader.result), mimeType: file.type as typeof supported[number], fileName: file.name || `voice-note.${file.type.split("/")[1] || "webm"}`, size: file.size, state: "transcribing" };
      setVoiceNote(note);
      transcribeVoice.mutate({ audioBase64: note.base64, mimeType: note.mimeType, fileName: note.fileName, originalLanguage: form.originalLanguage }, {
        onSuccess: result => {
          setVoiceNote(current => current?.id === id ? { ...current, state: "transcribed", audioUrl: result.audioUrl, transcript: result.transcript } : current);
          setForm(current => ({ ...current, description: current.description.trim() ? `${current.description.trim()}\n\n${result.transcript}` : result.transcript, title: current.title.trim() ? current.title : `Voice report — ${result.transcript.slice(0, 120)}`.slice(0, 280) }));
          toast.success("Transcription inserted into the report. Review it, then submit the voice report.");
        },
        onError: error => {
          setVoiceNote(current => current?.id === id ? { ...current, state: "failed", error: error.message } : current);
          toast.error("Transcription could not be completed. You can retry or type your report before submitting.");
        },
      });
    };
    reader.onerror = () => toast.error("The audio file could not be read.");
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast.error("In-browser recording is unavailable. Upload a voice note instead.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setVoiceFile(new File([blob], `civicnexus-voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" }));
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access was not granted. You can upload an existing voice note instead.");
    }
  };

  const stopRecording = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const retryTranscription = () => {
    if (!voiceNote) return;
    const file = new File([new Blob([Uint8Array.from(atob(voiceNote.base64.split(",").pop() || ""), char => char.charCodeAt(0))], { type: voiceNote.mimeType })], voiceNote.fileName, { type: voiceNote.mimeType });
    setVoiceFile(file);
  };

  return (
    <div className="min-h-screen bg-white text-black" dir={language.dir}>
      <header className="border-b border-black"><div className="page-grid flex h-16 items-center justify-between"><Link href="/" className="brand-mark">CIVIC<span>NEXUS</span></Link><Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] hover:text-red-700"><ArrowLeft size={15} /> Return to public view</Link></div></header>
      <main className="page-grid py-10 lg:py-16">
        <div className="mb-12 grid gap-6 border-b border-black pb-10 lg:grid-cols-[1.1fr_.9fr]">
          <div><p className="section-kicker">{copy.eyebrow}</p><h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[.96] tracking-[-.06em] md:text-6xl">{copy.heading}</h1></div>
          <div className="self-end border-l-4 border-red-600 pl-5 text-sm leading-6 text-neutral-700"><p>{copy.intro}</p><p className="mt-4 font-semibold text-black"><ShieldCheck className="mr-2 inline-block h-4 w-4 text-red-700" />{copy.review}</p></div>
        </div>
        {loading ? <section className="border border-black bg-neutral-50 p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-red-700" /><p className="mt-3 text-sm font-semibold">Checking secure access…</p></section> : null}
        {!loading && !user ? (
          <section className="border border-black bg-neutral-50 p-8 text-center max-w-xl mx-auto shadow-lg">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900">{copy.signedOut}</h3>
            <p className="mt-2 text-xs text-neutral-600 leading-5">
              You can sign in via OAuth or click Direct Enter to test the full submission workflow in Live Demo mode.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => {
                  localStorage.setItem("civicnexus-demo-mode", "true");
                  window.location.reload();
                }}
                className="w-full sm:w-auto rounded-none bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 text-sm"
              >
                🚀 Direct Enter Demo (Instant Access)
              </Button>
              <Button
                variant="outline"
                onClick={() => startLogin()}
                className="w-full sm:w-auto rounded-none border-black hover:bg-neutral-100 font-medium px-5 text-sm"
              >
                Sign in with OAuth
              </Button>
            </div>
          </section>
        ) : null}
        {user ? <form onSubmit={event => {
          event.preventDefault();
          if (!form.locationLabel) return toast.error("Please pin a location before submitting.");
          if (form.category === "agriculture" && form.farmDetails.cropOrLivestock.trim().length < 2) return toast.error("Please add the crop, livestock, or farm enterprise.");
          if (voiceNote?.state === "transcribing") return toast.error("Please wait for the voice transcription to finish, then review it before submitting.");
          
          const isDemo = typeof window !== "undefined" && window.location.hostname.includes("github.io");
          if (isDemo) {
            toast.success("Civic request saved. Loading verified AI analysis trace…");
            navigate("/signal/101");
            return;
          }

          const payload = { ...form, farmDetails: form.category === "agriculture" ? form.farmDetails : undefined };
          if (voiceNote) return submitVoice.mutate({ ...payload, mimeType: voiceNote.mimeType, fileName: voiceNote.fileName, ...(voiceNote.audioUrl ? { audioUrl: voiceNote.audioUrl } : { audioBase64: voiceNote.base64 }) });
          submit.mutate(payload);
        }} className="grid gap-10 lg:grid-cols-[.83fr_1.17fr]">
          <section className="space-y-7">
            <label className="field-label">{copy.language}<select value={form.originalLanguage} onChange={event => setForm(current => ({ ...current, originalLanguage: event.target.value as Language }))} className="field-control mt-2"><option value="en">English</option><option value="hi">हिन्दी</option><option value="ru">Русский</option><option value="zh">中文</option><option value="pt">Português</option><option value="ar">العربية</option></select></label>
            <div className="grid gap-6 sm:grid-cols-2"><label className="field-label">{copy.country}<select value={form.country} onChange={event => selectCountry(event.target.value as Country)} className="field-control mt-2">{BRICS_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label><label className="field-label">{copy.category}<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value as Category }))} className="field-control mt-2">{CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label></div>
            {form.category === "agriculture" ? <section className="border-2 border-emerald-700 bg-emerald-50 p-5"><div className="flex items-start gap-3"><Sprout className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="field-label !text-emerald-800">{farmCopy.title}</p><p className="mt-2 text-xs leading-5 text-neutral-700">{farmCopy.safety}</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="field-label">{farmCopy.enterprise}<input required value={form.farmDetails.cropOrLivestock} onChange={event => setForm(current => ({ ...current, farmDetails: { ...current.farmDetails, cropOrLivestock: event.target.value } }))} className="field-control mt-2" placeholder={farmCopy.placeholder} /></label><label className="field-label">{farmCopy.issue}<select value={form.farmDetails.issueType} onChange={event => setForm(current => ({ ...current, farmDetails: { ...current.farmDetails, issueType: event.target.value as FarmerIssue } }))} className="field-control mt-2"><option value="crop_health">{farmCopy.cropHealth}</option><option value="pests">{farmCopy.pests}</option><option value="irrigation">{farmCopy.irrigation}</option><option value="soil">{farmCopy.soil}</option><option value="weather">{farmCopy.weather}</option><option value="market_access">{farmCopy.market}</option><option value="livestock">{farmCopy.livestock}</option></select></label><label className="field-label">{farmCopy.stage}<input value={form.farmDetails.growthStage} onChange={event => setForm(current => ({ ...current, farmDetails: { ...current.farmDetails, growthStage: event.target.value } }))} className="field-control mt-2" /></label><label className="field-label">{farmCopy.scale}<select value={form.farmDetails.farmScale} onChange={event => setForm(current => ({ ...current, farmDetails: { ...current.farmDetails, farmScale: event.target.value as typeof current.farmDetails.farmScale } }))} className="field-control mt-2"><option value="smallholder">{farmCopy.smallholder}</option><option value="small">{farmCopy.small}</option><option value="medium">{farmCopy.medium}</option><option value="cooperative">{farmCopy.cooperative}</option></select></label></div></section> : null}
            <fieldset><legend className="field-label">{copy.urgency}</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["low", "medium", "high", "critical"] as Urgency[]).map(level => <button type="button" key={level} onClick={() => setForm(current => ({ ...current, urgency: level }))} className={`border px-3 py-3 text-left text-sm font-bold uppercase tracking-wider transition-colors ${form.urgency === level ? "border-red-700 bg-red-700 text-white" : "border-black hover:border-red-700"}`}>{urgencyLabel[level]}</button>)}</div></fieldset>
            <label className="field-label">{copy.title}<input required minLength={8} maxLength={280} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} className="field-control mt-2" placeholder={form.originalLanguage === "en" ? form.category === "agriculture" ? "Example: Rice leaves show new spots after heavy rain" : "Example: Seasonal flooding blocks clinic access" : ""} /></label>
            <label className="field-label">{copy.description}<textarea required minLength={25} maxLength={5000} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} className="field-control mt-2 min-h-40 resize-y" placeholder={form.originalLanguage === "en" ? form.category === "agriculture" ? "Describe visible changes, timing, irrigation or weather conditions, and the effect on the farm. Do not include unsafe personal details." : "Describe the issue, its frequency, the people affected, and any safe public context you can share." : ""} /></label>
            <div className="border border-black bg-neutral-50 p-4" aria-live="polite"><div className="flex items-start justify-between gap-4"><div><p className="field-label">Voice report (optional)</p><p className="mt-2 text-xs leading-5 text-neutral-600">1. Record or upload up to 16 MB. 2. We transcribe the speech into the description field. 3. Review or edit the text. 4. Select <strong>Save reviewed voice report</strong> below.</p></div><FileAudio className="h-5 w-5 shrink-0 text-red-700" /></div><div className="mt-4 flex flex-wrap gap-2">{recording ? <Button type="button" onClick={stopRecording} variant="outline" className="rounded-none border-red-700 text-red-700"><Square /> Stop recording & transcribe</Button> : <Button disabled={voiceNote?.state === "transcribing"} type="button" onClick={startRecording} variant="outline" className="rounded-none border-black"><Mic /> Record voice</Button>}<label className={`inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider ${voiceNote?.state === "transcribing" ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-red-700"}`}><Upload className="h-4 w-4" /> Upload audio<input disabled={voiceNote?.state === "transcribing"} type="file" accept="audio/webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4,.m4a" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) setVoiceFile(file); }} /></label>{voiceNote ? <button type="button" onClick={() => setVoiceNote(null)} className="text-xs font-bold text-red-700 underline">Remove voice note</button> : null}</div>{voiceNote?.state === "transcribing" ? <p className="mt-3 flex items-center gap-2 border-l-2 border-red-700 pl-3 text-xs font-semibold"><Loader2 className="h-4 w-4 animate-spin text-red-700" />Voice captured. Transcribing it into your report now…</p> : null}{voiceNote?.state === "transcribed" ? <p className="mt-3 flex items-center gap-2 border-l-2 border-emerald-700 pl-3 text-xs font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-700" />Transcript ready in the description field. Review it, then submit your voice report.</p> : null}{voiceNote?.state === "failed" ? <div className="mt-3 border-l-2 border-red-700 pl-3 text-xs"><p className="font-semibold text-red-800">The transcription needs another attempt.</p><p className="mt-1 text-neutral-600">{voiceNote.error}</p><Button type="button" variant="outline" onClick={retryTranscription} className="mt-3 rounded-none border-red-700 text-red-700"><Sparkles /> Retry transcription</Button></div> : null}{voiceNote ? <p className="mt-3 text-xs text-neutral-600">{voiceNote.fileName} · {(voiceNote.size / 1024 / 1024).toFixed(2)} MB</p> : null}</div>
          </section>
          <section><div className="border border-black bg-black p-5 text-white"><div className="flex items-start justify-between gap-4"><div><p className="section-kicker !text-red-300">{copy.location}</p><p className="mt-2 text-sm text-neutral-300">{copy.pinHelp}</p></div><MapPin className="h-6 w-6 shrink-0 text-red-500" /></div><p className="mt-5 border-l-2 border-red-500 pl-3 text-sm font-medium">{form.locationLabel || "No location selected yet"}</p></div><RequestMap interactive onMapError={() => setMapUnavailable(true)} onLocationPick={point => setForm(current => ({ ...current, latitude: point.lat, longitude: point.lng, locationLabel: point.label }))} />{mapUnavailable ? <div className="grid gap-3 border-x border-b border-black bg-neutral-50 p-5 sm:grid-cols-3"><label className="field-label sm:col-span-3">Manual location fallback</label><input value={form.locationLabel} onChange={event => setForm(current => ({ ...current, locationLabel: event.target.value }))} className="field-control sm:col-span-3" placeholder="Locality, district, or public landmark" /><input value={form.latitude} type="number" step="any" onChange={event => setForm(current => ({ ...current, latitude: Number(event.target.value) }))} className="field-control" aria-label="Latitude" /><input value={form.longitude} type="number" step="any" onChange={event => setForm(current => ({ ...current, longitude: Number(event.target.value) }))} className="field-control" aria-label="Longitude" /></div> : null}<div className="flex flex-wrap items-center justify-between gap-4 border-x border-b border-black p-5"><p className="max-w-md text-xs leading-5 text-neutral-600">When a voice report is selected, its reviewed transcript and original audio are saved together. Optional AI analysis runs later from the secure trace.</p><Button disabled={submit.isPending || submitVoice.isPending || voiceNote?.state === "transcribing"} type="submit" className="rounded-none bg-red-700 px-6 hover:bg-red-800">{submit.isPending || submitVoice.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} {voiceNote ? "Save reviewed voice report" : "Save request"}<ChevronRight /></Button></div></section>
        </form> : null}
      </main>
    </div>
  );
}
