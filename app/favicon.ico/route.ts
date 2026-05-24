const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#17443b"/>
  <path d="M19 41c4 5 18 5 26 0" fill="none" stroke="#f5f0e8" stroke-width="5" stroke-linecap="round"/>
  <path d="M21 25c4-6 18-8 25 1" fill="none" stroke="#f5f0e8" stroke-width="5" stroke-linecap="round"/>
  <circle cx="24" cy="33" r="3" fill="#f5f0e8"/>
  <circle cx="40" cy="33" r="3" fill="#f5f0e8"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
