import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string; // Color de acento opcional (heredado del local o servilleta)
}

/**
 * Ícono de Salsa: Tazón de salsa con cuchara sumergida
 * Inspirado en el estilo ilustrado del diseño de referencia
 */
export const SalsaIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 26, color }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Tazón */}
      <path
        d="M5 13C5 20.1797 10.3726 25 17 25C23.6274 25 29 20.1797 29 13H5Z"
        fill={color ? `${color}25` : '#93c5fd33'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base del tazón */}
      <path
        d="M12 25L10 27H24L22 25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Nivel de salsa en el borde */}
      <path
        d="M6 13C9 14.5 13 14.5 17 13C21 11.5 25 13 28 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Cuchara sumergida */}
      <path
        d="M20 15L25 5C25.3 4.4 26 4.1 26.6 4.4C27.2 4.7 27.5 5.4 27.2 6L22.5 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Ícono de Carbohidrato: Tazón con arroz cocido esponjoso
 */
export const CarbohidratoIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 26, color }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Montículo de arroz */}
      <path
        d="M7 16C7 11.5 11 8 16 8C21 8 25 11.5 25 16H7Z"
        fill={color ? `${color}25` : '#93c5fd33'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Textura de granos de arroz */}
      <path
        d="M13 11C14 11 14.5 12 14.5 12M18 10.5C18.5 11.2 18 12 18 12M10.5 13.5C11.2 13.5 11.5 14 11.5 14M21 13.5C21.5 14 21 14.5 21 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Tazón */}
      <path
        d="M6 16C6 22 10.5 25 16 25C21.5 25 26 22 26 16H6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base */}
      <path
        d="M11 25L10 27H22L21 25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Ícono de Guarnición: Piña tropical con corona de hojas y grabado
 */
export const GuarnicionIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 26, color }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hojas de la corona */}
      <path
        d="M16 4C14 7 13 9 14 11C12 8 10 9 11 12C9 9 7 11 9 13C12 13 15 13 16 13C17 13 20 13 23 13C25 11 23 9 21 12C22 9 20 8 18 11C19 9 18 7 16 4Z"
        fill={color ? `${color}25` : '#86efac33'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cuerpo ovalado de la piña */}
      <ellipse
        cx="16"
        cy="21"
        rx="7.5"
        ry="9"
        fill={color ? `${color}20` : '#fde04733'}
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Grabado romboidal de la cáscara */}
      <path
        d="M11.5 16L20.5 25M20.5 16L11.5 25M9.5 20.5H22.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Ícono de Ensalada: Tazón de ensalada con hojas frescas troceadas
 */
export const EnsaladaIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 26, color }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hojas de ensalada que sobresalen */}
      <path
        d="M9 14C8 10 11 8 14 9.5C15 7.5 18 7.5 19 9.5C21.5 8 24 10 23 14H9Z"
        fill={color ? `${color}30` : '#86efac44'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rodajas / trozos de verdura */}
      <path
        d="M12.5 11.5C13.5 11.5 14 12.5 14 12.5M17.5 10C18.5 11 18.5 12 18.5 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Tazón */}
      <path
        d="M6 14C6 20.5 10.5 24 16 24C21.5 24 26 20.5 26 14H6Z"
        fill={color ? `${color}15` : '#93c5fd22'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base */}
      <path
        d="M12 24L11 26H21L20 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Ícono de Servilleta Enrollada 3D / Isométrica
 * Adopta dinámicamente el color real de la servilleta (Lila, Amarillo, Azul noche, etc.)
 */
interface RolledNapkinProps {
  color?: string;
  size?: number;
  className?: string;
}

export const RolledNapkinIcon: React.FC<RolledNapkinProps> = ({
  color = '#8b5cf6', // Lila por defecto
  size = 36,
  className = '',
}) => {
  // Gradiente id para evitar colisiones
  const gradId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Sombra proyectada */}
        <filter id={`shadow-${gradId}`} x="4" y="24" width="40" height="20" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        {/* Gradiente del cuerpo cilíndrico de la servilleta */}
        <linearGradient id={`cylinder-${gradId}`} x1="12" y1="12" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="45%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.75" />
        </linearGradient>
        {/* Brillo en la cresta superior del rollo */}
        <linearGradient id={`sheen-${gradId}`} x1="14" y1="10" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Gradiente de la espiral del extremo enrollado */}
        <radialGradient id={`coil-${gradId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="70%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* Sombra base */}
      <ellipse
        cx="25"
        cy="36"
        rx="15"
        ry="4"
        fill="#0f172a"
        opacity="0.25"
        filter={`url(#shadow-${gradId})`}
      />

      {/* Cuerpo del cilindro enrollado (en ángulo isométrico) */}
      <path
        d="M17 12L35 30C37.5 32.5 36.5 36.5 33 38.5C30.5 40 27 39.5 25 37.5L7 19.5C5 17.5 5.5 14 8.5 12.5C11.5 11 14.5 11.5 17 12Z"
        fill={`url(#cylinder-${gradId})`}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Cresta de luz / reflejo */}
      <path
        d="M16 13L33 30"
        stroke={`url(#sheen-${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Extremo enrollado frontal (círculo / espiral visible en 3D) */}
      <g transform="translate(4, 13) rotate(-35)">
        <ellipse
          cx="8"
          cy="8"
          rx="6.5"
          ry="7.5"
          fill={`url(#coil-${gradId})`}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1.2"
        />
        {/* Espiral interna del enrollado */}
        <path
          d="M8 3.5C11 3.5 12.5 5.5 12.5 8C12.5 10.5 10.5 12.5 8 12.5C5.5 12.5 4 10.5 4 8C4 6.2 5.2 5 6.8 5C8.4 5 9.2 6.2 9.2 7.5C9.2 8.5 8.5 9.2 7.8 9.2C7 9.2 6.5 8.6 6.5 8"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
};
