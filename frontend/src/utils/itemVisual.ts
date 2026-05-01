import { createElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import {
  BadgeDollarSign,
  CarFront,
  CreditCard,
  Droplets,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  PlugZap,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tv,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react';

interface SmartItemAvatarProps {
  name?: string;
  provider?: string;
  category?: string;
  description?: string;
}

type SmartVisual =
  | { type: 'brand'; label: string; className: string }
  | { type: 'icon'; icon: ReactElement };

const baseStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const brandThemes: Record<string, CSSProperties> = {
  netflix: { background: '#ffe8e8', color: '#b20710', fontWeight: 800, fontSize: '0.78rem' },
  spotify: { background: '#e9fbef', color: '#1db954', fontWeight: 800, fontSize: '0.78rem' },
  youtube: { background: '#ffeaea', color: '#ff0000', fontWeight: 800, fontSize: '0.78rem' },
  disney: { background: '#eef2ff', color: '#1e40af', fontWeight: 800, fontSize: '0.78rem' },
  prime: { background: '#e8f6ff', color: '#0f6cbd', fontWeight: 800, fontSize: '0.78rem' },
};

const defaultIconStyle: CSSProperties = {
  background: '#edf3ff',
  color: '#2b5ecf',
};

export function SmartItemAvatar({
  name,
  provider,
  category,
  description,
}: SmartItemAvatarProps) {
  const visual = getSmartItemVisual({ name, provider, category, description });

  if (visual.type === 'brand') {
    return createElement(
      'span',
      {
        className: `dashboard-schedule-icon bills-brand-avatar ${visual.className}`,
        style: { ...baseStyle, ...(brandThemes[visual.className] || defaultIconStyle) },
      },
      visual.label,
    );
  }

  return createElement(
    'span',
    {
      className: 'dashboard-schedule-icon bills-smart-avatar',
      style: { ...baseStyle, ...defaultIconStyle },
    },
    visual.icon,
  );
}

export function getSmartItemVisual({
  name = '',
  provider = '',
  category = '',
  description = '',
}: SmartItemAvatarProps): SmartVisual {
  const source = `${name} ${provider} ${category} ${description}`.toLowerCase();

  if (source.includes('netflix')) return { type: 'brand', label: 'N', className: 'netflix' };
  if (source.includes('spotify')) return { type: 'brand', label: 'S', className: 'spotify' };
  if (source.includes('youtube')) return { type: 'brand', label: 'YT', className: 'youtube' };
  if (source.includes('disney')) return { type: 'brand', label: 'D+', className: 'disney' };
  if (source.includes('prime')) return { type: 'brand', label: 'P', className: 'prime' };

  if (source.includes('water') || source.includes('maynilad') || source.includes('manila water')) {
    return { type: 'icon', icon: createElement(Droplets, { size: 16 }) };
  }
  if (
    source.includes('electric') ||
    source.includes('power') ||
    source.includes('energy') ||
    source.includes('meralco') ||
    source.includes('utility') ||
    source.includes('utilities')
  ) {
    return { type: 'icon', icon: createElement(PlugZap, { size: 16 }) };
  }
  if (
    source.includes('internet') ||
    source.includes('wifi') ||
    source.includes('fiber') ||
    source.includes('broadband') ||
    source.includes('pldt') ||
    source.includes('globe')
  ) {
    return { type: 'icon', icon: createElement(Wifi, { size: 16 }) };
  }
  if (
    source.includes('mobile') ||
    source.includes('phone') ||
    source.includes('cell') ||
    source.includes('postpaid')
  ) {
    return { type: 'icon', icon: createElement(Smartphone, { size: 16 }) };
  }
  if (
    source.includes('subscription') ||
    source.includes('stream') ||
    source.includes('cable') ||
    source.includes('tv')
  ) {
    return { type: 'icon', icon: createElement(Tv, { size: 16 }) };
  }
  if (source.includes('rent') || source.includes('mortgage')) {
    return { type: 'icon', icon: createElement(House, { size: 16 }) };
  }
  if (source.includes('loan')) {
    return { type: 'icon', icon: createElement(CreditCard, { size: 16 }) };
  }
  if (source.includes('insurance')) {
    return { type: 'icon', icon: createElement(ShieldCheck, { size: 16 }) };
  }
  if (source.includes('transport') || source.includes('fuel') || source.includes('gas')) {
    return { type: 'icon', icon: createElement(CarFront, { size: 16 }) };
  }
  if (source.includes('health') || source.includes('hospital') || source.includes('medical')) {
    return { type: 'icon', icon: createElement(HeartPulse, { size: 16 }) };
  }
  if (source.includes('school') || source.includes('tuition') || source.includes('education')) {
    return { type: 'icon', icon: createElement(GraduationCap, { size: 16 }) };
  }
  if (source.includes('grocery')) {
    return { type: 'icon', icon: createElement(ShoppingBag, { size: 16 }) };
  }
  if (source.includes('dining') || source.includes('restaurant') || source.includes('food')) {
    return { type: 'icon', icon: createElement(UtensilsCrossed, { size: 16 }) };
  }
  if (source.includes('shop')) {
    return { type: 'icon', icon: createElement(ShoppingBag, { size: 16 }) };
  }
  if (source.includes('tax') || source.includes('fee')) {
    return { type: 'icon', icon: createElement(BadgeDollarSign, { size: 16 }) };
  }
  if (source.includes('bank') || source.includes('savings') || source.includes('budget')) {
    return { type: 'icon', icon: createElement(HandCoins, { size: 16 }) };
  }

  return { type: 'icon', icon: createElement(Receipt, { size: 16 }) };
}
