import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  iconOnly?: boolean;
  alt?: string;
}

export function BrandLogo({
  className = 'h-8 w-auto object-contain',
  width = 160,
  height = 40,
  priority = false,
  iconOnly = false,
  alt = 'Vaatify GEO',
}: BrandLogoProps) {
  const lightSrc = iconOnly ? '/logo-icon.svg' : '/logo.svg';
  const darkSrc = iconOnly ? '/logo-icon-dark.svg' : '/logo-dark.svg';
  const defaultW = iconOnly ? 33 : width;
  const defaultH = iconOnly ? 33 : height;

  return (
    <span className="relative inline-flex items-center">
      {/* Light mode logo (visible in light mode, hidden in dark mode) */}
      <Image
        src={lightSrc}
        alt={alt}
        width={defaultW}
        height={defaultH}
        priority={priority}
        className={`${className} dark:hidden block`}
      />
      {/* Dark mode logo (hidden in light mode, visible in dark mode) */}
      <Image
        src={darkSrc}
        alt={alt}
        width={defaultW}
        height={defaultH}
        priority={priority}
        className={`${className} hidden dark:block`}
      />
    </span>
  );
}

export default BrandLogo;
