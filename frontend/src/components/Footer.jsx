import { useLanguage } from '../context/LanguageContext';
import AgroGebeyaLogo from './AgroGebeyaLogo';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-row">
          <AgroGebeyaLogo size={28} />
        </div>
        <span>Empowering smallholders, cooperative unions & wholesale buyers across all regions of Ethiopia.</span>
        <span>&copy; {new Date().getFullYear()} {t('brandName')} &middot; Telebirr & CBE Escrow Protected</span>
      </div>
    </footer>
  );
}
