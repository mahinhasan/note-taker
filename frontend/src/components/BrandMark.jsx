export default function BrandMark({ className = 'brand__mark' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="23" fill="#ffffff" />
      <g stroke="#040714" strokeWidth="1.6" strokeLinecap="round">
        <path d="M18 16.5 10.5 13M18 18.5 10.5 21M30 16.5l7.5-3.5M30 18.5l7.5 2.5" />
      </g>
      <path d="M17.5 14 24 8.5l6.5 5.5Z" fill="#040714" />
      <rect x="19" y="14" width="10" height="6" fill="#040714" />
      <rect x="21" y="15.6" width="6" height="2.8" rx="0.6" fill="#ff3d00" />
      <rect x="17" y="20" width="14" height="2" rx="0.5" fill="#040714" />
      <path d="M19 22h10l3 17H16Z" fill="#ff3d00" />
      <path d="M18.3 26h11.4l.5 3H17.8ZM17.2 32h13.6l.5 3H16.7Z" fill="#040714" />
      <rect x="22.6" y="35.6" width="2.8" height="3.4" rx="1.2" fill="#040714" />
      <rect x="10" y="39" width="28" height="2.4" rx="1.2" fill="#040714" />
      <path d="M14 43.5c1.7-1 3.3-1 5 0s3.3 1 5 0 3.3-1 5 0 3.3 1 5 0" fill="none" stroke="#040714" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
