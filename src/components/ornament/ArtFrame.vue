<template>
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 400 400"
    fill="none"
    aria-hidden="true"
  >
    <g transform="translate(200 200) scale(0.78) translate(-200 -200)">
      <rect
        x="86"
        y="86"
        width="228"
        height="228"
        rx="26"
        fill="rgba(255,255,255,0.55)"
        stroke="rgba(255,255,255,0.95)"
        stroke-width="1.6"
      />
      <rect
        x="78"
        y="78"
        width="244"
        height="244"
        rx="32"
        stroke="#9dcfb4"
        stroke-width="1.15"
      />
      <g
        id="vine-corner"
        stroke="#3f8f68"
        stroke-width="1.35"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 146C18 70 62 22 146 18" />
        <path d="M34 132C36 84 74 40 132 34" />
        <path d="M52 118C62 78 92 58 118 52" />
        <path d="M70 104C78 78 98 66 112 78C126 90 112 108 94 100" />
        <path d="M86 86C74 70 78 52 96 48C114 44 122 64 108 76" />
        <path d="M48 86C64 78 72 92 60 104" />
        <path d="M104 46C112 62 128 66 136 52" />
        <path d="M28 108C46 100 54 116 42 128" />
        <path d="M118 30C126 46 142 48 148 34" />
        <path
          d="M58 96c10-12 24-8 22 6-12 2-22-2-22-6z"
          fill="#8fc9a8"
          stroke="none"
        />
        <path
          d="M96 58c12-8 24 2 16 14-10 2-18-4-16-14z"
          fill="#c5ead4"
          stroke="none"
        />
        <path
          d="M40 112c12-6 22 4 14 14-10 0-16-8-14-14z"
          fill="#6aaf88"
          stroke="none"
        />
        <path
          d="M112 36c8 10 2 18-8 16 0-8 2-14 8-16z"
          fill="#d7f3e2"
          stroke="none"
        />
        <path d="M146 18c16 10 28 8 40 2" />
        <path d="M18 146c10 16 8 28 2 40" />
        <path d="M158 28c8 8 6 16-2 18" />
        <path d="M28 158c8 8 16 6 18-2" />
      </g>
      <use href="#vine-corner" transform="translate(400 0) scale(-1 1)" />
      <use href="#vine-corner" transform="translate(0 400) scale(1 -1)" />
      <use href="#vine-corner" transform="translate(400 400) scale(-1 -1)" />
    </g>
  </svg>
</template>
