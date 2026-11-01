import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { advisoryService } from '../services/advisoryService';

const SAMPLE_DISEASES = [
  { id: 'coffee_cbd', label: '☕ Coffee Berry Disease', crop: 'Coffee', icon: '☕', desc: 'Dark sunken spots on green coffee berries' },
  { id: 'coffee_rust', label: '🌿 Coffee Leaf Rust', crop: 'Coffee', icon: '🌿', desc: 'Yellow-orange powdery spots on leaves' },
  { id: 'enset_bacterial_wilt', label: '🍌 Enset Bacterial Wilt', crop: 'Enset', icon: '🍌', desc: 'Yellowing leaves & bacterial ooze' },
  { id: 'maize_fall_armyworm', label: '🌽 Maize Fall Armyworm', crop: 'Maize', icon: '🌽', desc: 'Chewed leaf whorl with sawdust frass' },
  { id: 'wheat_stem_rust', label: '🌾 Wheat Stem Rust (Ug99)', crop: 'Wheat', icon: '🌾', desc: 'Red-brown spore pustules on stems' },
  { id: 'teff_head_smut', label: '🌾 Teff Head Smut', crop: 'Teff', icon: '🌾', desc: 'Black sooty grain florets destroying panicle' },
  { id: 'ginger_bacterial_wilt', label: '🫚 Ginger Bacterial Wilt', crop: 'Ginger', icon: '🫚', desc: 'Yellowing foliage & rotting rhizome' },
  { id: 'avocado_root_rot', label: '🥑 Avocado Root Rot', crop: 'Avocado', icon: '🥑', desc: 'Pale wilted leaves & black brittle roots' },
  { id: 'non_agro', label: '🚗 Test Non-Agro Item (Car / Shoe / Phone)', crop: 'Non-Agro', icon: '🚗', desc: 'Test system rejection for non-crop objects' },
];

const CROP_OPTIONS = [
  { value: 'Auto', label: '🔍 Auto-Detect Crop from Image / Text' },
  { value: 'Coffee', label: '☕ Coffee (ቡና)' },
  { value: 'Enset', label: '🍌 Enset / Kocho (እንሰት / ቆጮ)' },
  { value: 'Maize', label: '🌽 Maize (በቆሎ)' },
  { value: 'Wheat', label: '🌾 Wheat (ስንዴ)' },
  { value: 'Teff', label: '🌾 Teff (ጤፍ)' },
  { value: 'Ginger', label: '🫚 Ginger (ዝንጅብል)' },
  { value: 'Avocado', label: '🥑 Avocado (አቮካዶ)' },
];

const LANGUAGE_TABS = [
  { code: 'am', label: '🇪🇹 አማርኛ', name: 'Amharic' },
  { code: 'om', label: '🟢 Afaan Oromoo', name: 'Oromo' },
  { code: 'wot', label: '🟡 ወላይታቱ', name: 'Wolaytta' },
  { code: 'ti', label: '🔴 ትግርኛ', name: 'Tigrinya' },
  { code: 'en', label: '🌐 English', name: 'English' },
];

export default function AiCropScannerWidget({ onPosted }) {
  const { lang } = useLanguage();
  const [activeLang, setActiveLang] = useState(lang || 'am');
  const [selectedCrop, setSelectedCrop] = useState('Auto');
  const [selectedSample, setSelectedSample] = useState('coffee_cbd');
  const [customSymptom, setCustomSymptom] = useState('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postedStatus, setPostedStatus] = useState('idle'); // 'idle' | 'posted' | 'declined'
  const fileInputRef = useRef(null);

  // Sync with global language if changed in Navbar
  useEffect(() => {
    if (lang) setActiveLang(lang);
  }, [lang]);

  const getLangText = (item, currentLang) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item[currentLang] || item.am || item.en || item.om || item.wot || item.ti || Object.values(item)[0] || '';
  };

  const getProtocol = (protocolObj, currentLang) => {
    if (!protocolObj) return { title: '', steps: [], formulation: '', dosage: '', timing: '' };
    if (protocolObj[currentLang]) return protocolObj[currentLang];
    return protocolObj.am || protocolObj.en || Object.values(protocolObj)[0] || protocolObj;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target.result;

      // Smart client-side resize to prevent PayloadTooLarge
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setUploadedImagePreview(optimizedBase64);
        runDiagnosis(undefined, customSymptom, file.name, selectedCrop, optimizedBase64);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const runDiagnosis = async (sampleId, customText, fileName, cropChoice, base64Override) => {
    setScanning(true);
    setError('');
    setDiagnosis(null);
    setCopied(false);
    setPostedStatus('idle');

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const activeCrop = cropChoice || selectedCrop;
      const payload = {
        sampleId: sampleId !== undefined ? sampleId : undefined,
        cropType: activeCrop !== 'Auto' ? activeCrop : undefined,
        symptomsText: customText !== undefined ? customText : customSymptom,
        fileName: fileName || uploadedFileName,
        imageBase64: base64Override || uploadedImagePreview,
      };

      const data = await advisoryService.diagnose(payload);
      if (data && data.success) {
        setDiagnosis(data);
      } else {
        setError('Diagnosis failed. Please try again.');
      }
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError('Could not connect to AI diagnostic server. Please make sure the backend is active.');
    } finally {
      setScanning(false);
    }
  };

  const handleCopySMS = () => {
    if (diagnosis?.smsPrescriptionTemplate) {
      navigator.clipboard.writeText(diagnosis.smsPrescriptionTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Handler to Post Verified Scan directly to Mongo Database & Public Advisory Grid
  const handlePostToAdvisory = async () => {
    if (!diagnosis) return;
    setPosting(true);
    try {
      const diseaseEn = typeof diagnosis.diseaseName === 'object' ? (diagnosis.diseaseName.en || diagnosis.diseaseName.am) : diagnosis.diseaseName;
      const diseaseAm = typeof diagnosis.diseaseName === 'object' ? diagnosis.diseaseName.am : diagnosis.diseaseAm;
      const diseaseOm = typeof diagnosis.diseaseName === 'object' ? diagnosis.diseaseName.om : diagnosis.diseaseOr;
      const diseaseWot = typeof diagnosis.diseaseName === 'object' ? diagnosis.diseaseName.wot : diagnosis.diseaseWl;
      const diseaseTi = typeof diagnosis.diseaseName === 'object' ? diagnosis.diseaseName.ti : '';

      const extractSteps = (proto) => {
        if (!proto) return '';
        if (typeof proto === 'string') return proto;
        if (Array.isArray(proto.steps)) return proto.steps.join(' ');
        if (proto.en && Array.isArray(proto.en.steps)) return proto.en.steps.join(' ');
        if (proto.en && typeof proto.en.steps === 'string') return proto.en.steps;
        return '';
      };

      const extractAmSteps = (proto) => {
        if (!proto) return '';
        if (proto.am && Array.isArray(proto.am.steps)) return proto.am.steps.join(' ');
        if (proto.am && typeof proto.am.steps === 'string') return proto.am.steps;
        return extractSteps(proto);
      };

      const extractChem = (proto, langKey) => {
        if (!proto) return '';
        const target = proto[langKey] || proto.en || proto;
        if (typeof target === 'string') return target;
        const form = target.formulation || '';
        const dose = target.dosage ? ` [${target.dosage}]` : '';
        const time = target.timing ? ` - ${target.timing}` : '';
        return `${form}${dose}${time}`.trim();
      };

      const postPayload = {
        cropName: diagnosis.crop || 'Crop',
        localNames: {
          am: diagnosis.cropTranslations?.am || diagnosis.cropAm || diagnosis.crop,
          om: diagnosis.cropTranslations?.om || diagnosis.crop,
          wot: diagnosis.cropTranslations?.wot || diagnosis.crop,
          ti: diagnosis.cropTranslations?.ti || diagnosis.crop,
        },
        pestOrDisease: diseaseEn || 'Crop Disease',
        scientificName: diseaseEn || '',
        severity: diagnosis.severity ? (diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)) : 'Critical',
        symptoms: {
          en: typeof diagnosis.clinicalSymptoms === 'object' ? (diagnosis.clinicalSymptoms.en || '') : String(diagnosis.clinicalSymptoms || ''),
          am: typeof diagnosis.clinicalSymptoms === 'object' ? (diagnosis.clinicalSymptoms.am || '') : '',
          om: typeof diagnosis.clinicalSymptoms === 'object' ? (diagnosis.clinicalSymptoms.om || '') : '',
          wot: typeof diagnosis.clinicalSymptoms === 'object' ? (diagnosis.clinicalSymptoms.wot || '') : '',
          ti: typeof diagnosis.clinicalSymptoms === 'object' ? (diagnosis.clinicalSymptoms.ti || '') : '',
        },
        prevention: {
          en: `Field scouting and certified seeds recommended by ${diagnosis.accreditedResearchCenter || 'EIAR'}.`,
          am: `በ ${diagnosis.accreditedResearchCenter || 'የግብርና ምርምር ማዕከል'} የተረጋገጡ ዝርያዎችን መጠቀምና የንጽህና አያያዝ።`,
          om: `Sanyii filatamaa fayyadamuu fi qulqullina eeguu.`,
          wot: `Zariyaa loytti aattidi go\'ettiyoogaa.`,
        },
        organicTreatment: {
          en: extractSteps(diagnosis.organicProtocol),
          am: extractAmSteps(diagnosis.organicProtocol),
          om: diagnosis.organicProtocol?.om ? extractSteps(diagnosis.organicProtocol.om) : '',
          wot: diagnosis.organicProtocol?.wot ? extractSteps(diagnosis.organicProtocol.wot) : '',
        },
        chemicalTreatment: {
          en: extractChem(diagnosis.chemicalProtocol, 'en'),
          am: extractChem(diagnosis.chemicalProtocol, 'am'),
          om: extractChem(diagnosis.chemicalProtocol, 'om'),
          wot: extractChem(diagnosis.chemicalProtocol, 'wot'),
        },
        imageUrl: uploadedImagePreview || '',
      };

      const res = await advisoryService.create(postPayload);
      setPostedStatus('posted');
      if (onPosted && res?.advisory) {
        onPosted(res.advisory);
      }
    } catch (err) {
      console.error('Failed to post advisory:', err);
      alert('Could not post advisory. Please ensure backend is connected.');
    } finally {
      setPosting(false);
    }
  };

  const currentDiseaseName = diagnosis ? getLangText(diagnosis.diseaseName, activeLang) : '';
  const currentCropName = diagnosis ? (getLangText(diagnosis.cropTranslations, activeLang) || diagnosis.crop) : '';
  const currentSymptoms = diagnosis ? getLangText(diagnosis.clinicalSymptoms, activeLang) : '';
  const currentOrganic = diagnosis ? getProtocol(diagnosis.organicProtocol, activeLang) : null;
  const currentChemical = diagnosis ? getProtocol(diagnosis.chemicalProtocol, activeLang) : null;

  return (
    <div className="ai-scanner-widget">
      <div className="ai-scanner-header">
        <div className="scanner-badge-pill">
          <span className="live-session-dot"></span>
          <strong>AI PLANT PATHOLOGY & MULTILINGUAL SCANNER</strong>
        </div>
        <h3>Multi-Crop Disease Diagnostics & Language Translation</h3>
        <p>
          Diagnoses real diseases across <strong>Coffee, Enset, Maize, Wheat, Teff, Ginger & Avocado</strong> with instant organic & chemical prescriptions in <strong>Amharic, Afaan Oromoo, Wolaytta, Tigrinya, and English</strong>.
        </p>
      </div>

      <div className="scanner-body-grid">
        {/* Left: Input & Leaf Preset Picker */}
        <div className="scanner-input-panel">
          {/* Crop Selector Dropdown */}
          <div className="crop-selector-control">
            <label className="scanner-panel-label">🌱 Select Target Crop Category:</label>
            <select
              className="scanner-crop-select"
              value={selectedCrop}
              onChange={(e) => {
                const newCrop = e.target.value;
                setSelectedCrop(newCrop);
                if (newCrop !== 'Auto') {
                  runDiagnosis(undefined, customSymptom, uploadedFileName, newCrop);
                }
              }}
            >
              {CROP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Dropzone */}
          <div className="scanner-upload-box" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            {uploadedImagePreview ? (
              <div className="uploaded-preview-container">
                <img src={uploadedImagePreview} alt="Scanned plant preview" className="uploaded-preview-img" />
                <div className="uploaded-file-tag">📁 {uploadedFileName} (Click to change photo)</div>
              </div>
            ) : (
              <div className="upload-placeholder-cta">
                <span className="upload-camera-icon">📷</span>
                <strong>Upload Photo from PC / Storage</strong>
                <small>Supports JPG, PNG, WEBP &bull; Click to browse files</small>
              </div>
            )}
          </div>

          <label className="scanner-panel-label" style={{ marginTop: '0.85rem' }}>1. Or Choose Quick Field Disease Presets:</label>
          <div className="sample-preset-grid">
            {SAMPLE_DISEASES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className={`sample-preset-card ${selectedSample === sample.id ? 'active' : ''} ${sample.id === 'non_agro' ? 'non-agro-card' : ''}`}
                onClick={() => {
                  setSelectedSample(sample.id);
                  setSelectedCrop(sample.crop === 'Non-Agro' ? 'Auto' : sample.crop);
                  setUploadedImagePreview(null);
                  setUploadedFileName('');
                  runDiagnosis(sample.id, '', '', sample.crop);
                }}
              >
                <span className="sample-icon">{sample.icon}</span>
                <div>
                  <strong>{sample.label}</strong>
                  <small>{sample.desc}</small>
                </div>
              </button>
            ))}
          </div>

          <div className="custom-symptom-box">
            <label className="scanner-panel-label">2. Or Describe Visual Observations:</label>
            <div className="symptom-input-row">
              <input
                type="text"
                placeholder="e.g. Enset yellow liquid, Maize holes in whorl, Wheat red pustules, shoes..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runDiagnosis(undefined, customSymptom, uploadedFileName, selectedCrop);
                  }
                }}
              />
              <button
                className="btn btn-primary"
                onClick={() => runDiagnosis(undefined, customSymptom, uploadedFileName, selectedCrop)}
                disabled={scanning}
              >
                {scanning ? 'Scanning...' : 'Scan 🔍'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Interactive Scanner Visualizer & Diagnostic Card */}
        <div className="scanner-output-panel">
          {scanning ? (
            <div className="scanner-active-animation">
              <div className="scanner-radar-frame">
                <div className="scanner-laser-line"></div>
                <div className="scanner-target-reticle"></div>
                {uploadedImagePreview ? (
                  <img src={uploadedImagePreview} alt="Scanning target" className="radar-sample-img" />
                ) : (
                  <span className="scanning-icon">🌿</span>
                )}
              </div>
              <strong className="scanning-text">Analyzing visual morphology & pathogen biomarkers...</strong>
              <small>Validating botanical taxonomy with Ethiopian Agricultural Research catalog</small>
            </div>
          ) : error ? (
            <div className="scanner-error-card">
              <span>⚠️</span>
              <p>{error}</p>
              <button className="btn btn-secondary btn-sm" onClick={() => runDiagnosis('coffee_cbd', '', '', 'Coffee')}>
                Retry Diagnostic Scan
              </button>
            </div>
          ) : diagnosis ? (
            /* Check if result is NON-AGRO product */
            diagnosis.isAgroProduct === false ? (
              <div className="non-agro-rejection-card">
                <div className="rejection-icon-box">
                  <span className="rejection-badge">⚠️ VALIDATION REJECTED</span>
                  <div className="rejection-big-icon">🚫</div>
                </div>

                <div className="rejection-content">
                  <h2 className="rejection-title">{diagnosis.message}</h2>
                  <h3 className="rejection-amharic">{diagnosis.messageAm || diagnosis.message}</h3>

                  <div className="rejection-reason-box">
                    <strong>🔍 Detection Reason:</strong>
                    <p>{diagnosis.reason}</p>
                    <small>Category Detected: <code>{diagnosis.detectedCategory || diagnosis.detectedObject}</code></small>
                  </div>

                  <div className="rejection-guidance-box">
                    <strong>💡 What to do next:</strong>
                    <p>{diagnosis.guidance}</p>
                  </div>

                  <div className="rejection-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedSample('maize_fall_armyworm');
                        setSelectedCrop('Maize');
                        runDiagnosis('maize_fall_armyworm', '', '', 'Maize');
                      }}
                    >
                      🌽 Scan Real Crop (e.g. Maize / Enset / Coffee)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* REAL AGRO PRODUCT DIAGNOSIS */
              <div className="diagnosis-result-card" style={{ '--severity-color': diagnosis.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                {/* 1-Click Language Selector Bar */}
                <div className="diagnosis-lang-bar">
                  <span className="lang-bar-label">🗣️ Translation / ቋንቋ:</span>
                  <div className="diagnosis-lang-pills">
                    {LANGUAGE_TABS.map((lt) => (
                      <button
                        key={lt.code}
                        type="button"
                        className={`lang-pill-btn ${activeLang === lt.code ? 'active' : ''}`}
                        onClick={() => setActiveLang(lt.code)}
                      >
                        {lt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="diagnosis-card-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                      <span className="eyebrow">{currentCropName} &bull; {diagnosis.pathogenType}</span>
                      {diagnosis.isCloudAi && (
                        <span className="cloud-ai-badge">☁️ Cloud Vision AI</span>
                      )}
                    </div>
                    <h2>{currentDiseaseName}</h2>
                  </div>

                  <div className="diagnosis-confidence-box">
                    <span className="confidence-num">{diagnosis.confidenceScore}</span>
                    <small>AI Confidence</small>
                  </div>
                </div>

                {/* Clinical Symptoms in Selected Language */}
                <div className="diagnosis-symptom-callout">
                  <strong>📋 {activeLang === 'am' ? 'የታዩ የበሽታው ምልክቶች:' : activeLang === 'om' ? 'Mallattoolee Mul\'atan:' : activeLang === 'wot' ? 'Beettida Harggetta Malatata:' : activeLang === 'ti' ? 'ዝተራእዩ ምልክታት ሕማም:' : 'Visual Symptoms Identified:'}</strong>
                  <p>{currentSymptoms}</p>
                </div>

                {/* Treatment Protocols in Selected Language */}
                <div className="diagnosis-protocols-grid">
                  <div className="protocol-box organic-protocol">
                    <h4>🌿 {activeLang === 'am' ? 'የተፈጥሮ / ባህላዊ ህክምና መመሪያ:' : activeLang === 'om' ? 'Yaala Aadaa fi Uumamaa:' : activeLang === 'wot' ? 'Medhetta Qora / Hayqqiyoogaa:' : activeLang === 'ti' ? 'ባህላዊ / ተፈጥሮኣዊ ፈውሲ:' : 'Recommended Organic / Cultural Remedy:'}</h4>
                    <strong>{currentOrganic?.title || 'Organic Protocol'}</strong>
                    <ul>
                      {currentOrganic?.steps && Array.isArray(currentOrganic.steps) ? (
                        currentOrganic.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))
                      ) : typeof currentOrganic?.steps === 'string' ? (
                        <li>{currentOrganic.steps}</li>
                      ) : (
                        <li>Follow cultural sanitation and aeration pruning.</li>
                      )}
                    </ul>
                  </div>

                  <div className="protocol-box chemical-protocol">
                    <h4>🧪 {activeLang === 'am' ? 'የግብርና ሚኒስቴር የኬሚካል መመሪያ:' : activeLang === 'om' ? 'Qoricha Ministeera Qonnaa:' : activeLang === 'wot' ? 'Goshsha Ministiriyaa Qora:' : activeLang === 'ti' ? 'ናይ ሚኒስትሪ ሕርሻ ኬሚካላዊ መምርሒ:' : 'Ministry of Agriculture Chemical Formulation:'}</h4>
                    <strong>{currentChemical?.title || 'Approved Formulation'}</strong>
                    <div className="chem-row"><span>{activeLang === 'am' ? 'መድኃኒት:' : activeLang === 'om' ? 'Qoricha:' : activeLang === 'wot' ? 'Qora:' : 'Formulation:'}</span> <strong>{currentChemical?.formulation || 'Standard formulation'}</strong></div>
                    <div className="chem-row"><span>{activeLang === 'am' ? 'መጠን:' : activeLang === 'om' ? 'Hamma:' : activeLang === 'wot' ? 'Kessiyoogaa:' : 'Dosage:'}</span> <strong>{currentChemical?.dosage || 'Standard dosage'}</strong></div>
                    <div className="chem-row"><span>{activeLang === 'am' ? 'የመርጫ ወቅት:' : activeLang === 'om' ? 'Yeroo:' : activeLang === 'wot' ? 'Wodiyaa:' : 'Timing:'}</span> <strong>{currentChemical?.timing || 'Apply during early onset'}</strong></div>
                  </div>
                </div>

                {/* POST OR DON'T POST DECISION SECTION */}
                <div className="diagnosis-sharing-decision-card">
                  {postedStatus === 'posted' ? (
                    <div className="decision-published-banner">
                      <span className="published-check-icon">✅</span>
                      <div>
                        <strong>Successfully Posted & Saved to Local Storage! (በተሳካ ሁኔታ ተለጥፏል)</strong>
                        <p>This diagnosis is now published to the public National Advisory Grid below and permanently stored in local MongoDB for offline access during internet outages.</p>
                      </div>
                    </div>
                  ) : postedStatus === 'declined' ? (
                    <div className="decision-private-banner">
                      <div className="private-info-text">
                        <span>🔒</span>
                        <span>Kept as private local scan session. Not posted to public advisory grid.</span>
                      </div>
                      <button type="button" className="btn-change-decision" onClick={() => setPostedStatus('idle')}>
                        Publish instead?
                      </button>
                    </div>
                  ) : (
                    <div className="decision-prompt-wrapper">
                      <div className="decision-prompt-text">
                        <span className="decision-tag-label">📢 PUBLIC ADVISORY CONTRIBUTION / ለህዝብ ማጋራት</span>
                        <h4>Do you want to post this scanned diagnosis to the public Advisory Board?</h4>
                        <p>
                          Posting will add this case to the <strong>National Crop Health Directory</strong> below and save it into <strong>local MongoDB storage</strong> so other farmers can access it offline.
                        </p>
                      </div>

                      <div className="decision-actions-row">
                        <button
                          type="button"
                          className="btn-decision-post"
                          disabled={posting}
                          onClick={handlePostToAdvisory}
                        >
                          {posting ? '⏳ Posting to Database...' : '📤 Post to Advisory Board (ለህዝብ አጋራ)'}
                        </button>
                        <button
                          type="button"
                          className="btn-decision-decline"
                          onClick={() => setPostedStatus('declined')}
                        >
                          ❌ Keep Private / Don't Post (አታጋራ)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="diagnosis-card-bottom">
                  <div className="research-contact">
                    <span>🏛️ Research Hub:</span> <strong>{diagnosis.accreditedResearchCenter}</strong>
                  </div>

                  <button className="btn btn-secondary btn-sm copy-sms-btn" onClick={handleCopySMS}>
                    {copied ? '✅ Prescription Copied!' : '📲 Copy SMS Prescription for Farmer Phone'}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="scanner-idle-placeholder" onClick={() => runDiagnosis('coffee_cbd', '', '', 'Coffee')}>
              <span className="placeholder-leaf-icon">🔬</span>
              <strong>Select a crop or click any preset to run AI Diagnosis</strong>
              <p>Detects diseases across Coffee, Enset, Maize, Wheat, Teff, Ginger & Avocado in your preferred language.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
