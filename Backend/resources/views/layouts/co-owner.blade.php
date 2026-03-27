<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Co-propriétaire')</title>
    <link rel="shortcut icon" href="{{ asset('images/logo.webp') }}" type="image/x-icon">
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary: #70AE48;
            --primary-dark: #5c8f3a;
            --primary-light: #f0f9e6;
            --primary-soft: rgba(112, 174, 72, 0.08);
            --text-green: #529D21;
            --gradient-green: linear-gradient(94.5deg, #8CCC63 5.47%, rgba(82, 157, 33, 0.87) 91.93%);
            --red: #ef4444;
            --red-light: #fee2e2;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
            --amber: #FFB300;
            --amber-light: #fef3c7;
            --shadow: 0 22px 70px rgba(0,0,0,.18);
            --sidebar-shadow: 0px 0px 20px rgba(0,0,0,0.05), 0px 5px 25px rgba(112,174,72,0.15);
            --font-manrope: 'Manrope', sans-serif;
            --font-merri: 'Merriweather', serif;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { font-size: 16px !important; }

        body {
            font-family: var(--font-merri);
            font-size: 16px !important;
            min-height: 100vh;
            background: #fff;
            overflow: hidden;
        }

        /* Reset global pour annuler Bootstrap ou tout autre framework CSS du projet */
        .sidebar, .sidebar * {
            box-sizing: border-box;
        }
        .sidebar button, .sidebar a, .sidebar span {
            font-size: inherit;
        }

        /* ─── HEADER ─── */
        .header {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 100;
            height: 72px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 3rem;
            background: var(--gradient-green);
        }

        .header-left { display: flex; align-items: center; gap: 0.75rem; }

        .header-logo {
            font-family: var(--font-merri);
            font-weight: 900;
            font-size: 1.85rem;
            color: #fff;
            letter-spacing: -0.01em;
        }

        .header-right { display: flex; align-items: center; gap: 1.5rem; }

        .header-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 2rem;
            border-radius: 9999px;
            background: rgba(255,255,255,0.4);
            border: none;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            font-family: var(--font-merri);
            backdrop-filter: blur(8px);
            transition: background 0.2s;
            position: relative;
            text-decoration: none;
        }
        .header-btn:hover { background: rgba(255,255,255,0.55); }

        .notif-badge {
            position: absolute;
            top: -4px; right: -4px;
            width: 20px; height: 20px;
            background: #f87171;
            color: white;
            font-size: 10px;
            font-weight: 700;
            border-radius: 9999px;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid #8CCC63;
        }
        .notif-badge.hidden { display: none; }

        .mobile-menu-btn {
            display: none;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 0.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            align-items: center;
            justify-content: center;
        }

        /* ─── LAYOUT ─── */
        .app-body {
            display: flex;
            height: calc(100vh - 72px);
            margin-top: 72px;
            background: white;
            position: relative;
        }

        /* ─── OVERLAY MOBILE ─── */
        .overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 90;
            display: none;
        }
        .overlay.active { display: block; }

        /* ─── SIDEBAR ─── */
        .sidebar {
            position: fixed;
            left: 30px;
            top: 100px;
            width: 400px;
            max-height: calc(100vh - 140px);
            background: white;
            border-radius: 24px;
            box-shadow: var(--sidebar-shadow);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            z-index: 120;
            transition: transform 0.3s ease;
        }

        .sidebar-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem 0.75rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .sidebar-scroll::-webkit-scrollbar { display: none; }

        /* ─── MENU GROUPS ─── */
        .menu-group { margin-bottom: 0.5rem; }

        .menu-group-title {
            font-size: 9.5px;
            font-weight: 600;
            letter-spacing: 0.12em;
            color: #9CA3AF;
            padding: 1.2rem 1.4rem 0.6rem;
            text-transform: uppercase;
            font-family: var(--font-manrope);
            white-space: nowrap;
            text-align: left;
        }

        /* ─── MENU ITEMS ─── */
        .menu-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 12px 24px;
            margin-bottom: 2px;
            border: none;
            background: transparent;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            font-family: var(--font-manrope);
            font-size: 17px !important;
            font-weight: 700;
            color: #6b7280;
            text-align: left;
            position: relative;
            text-decoration: none;
            line-height: 1.4;
        }

        .menu-item:hover { color: var(--text-green); }
        .menu-item:hover .menu-icon { opacity: 1; transform: scale(1.1); }

        .menu-item.active,
        .menu-item.active-parent {
            background: linear-gradient(90deg, rgba(255, 213, 124, 0.87) 0%, #FFFFFF 100%);
            color: var(--text-green);
        }

        .menu-item.active::before,
        .menu-item.active-parent::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 5px;
            height: 30px;
            background: var(--amber);
            border-radius: 0 9999px 9999px 0;
            box-shadow: 0px 0px 10px rgba(255, 179, 0, 0.4);
        }

        .menu-item.active .menu-icon,
        .menu-item.active-parent .menu-icon { opacity: 1; transform: scale(1.1); }

        .menu-icon {
            opacity: 0.6;
            transition: all 0.3s;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .menu-icon img {
            width: 18px;
            height: 18px;
            object-fit: contain;
        }

        .menu-icon svg {
            width: 18px;
            height: 18px;
        }

        .menu-item-label {
            flex: 1;
            white-space: nowrap;
            font-size: 17px !important;
            font-family: var(--font-manrope) !important;
            font-weight: 700 !important;
            line-height: 1.4;
        }

        .menu-item-chevron {
            margin-left: auto;
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }

        .menu-item-chevron svg {
            transition: transform 0.3s;
            stroke: var(--text-green);
        }

        .menu-item-chevron.open svg { transform: rotate(180deg); }

        .menu-item-arrow {
            margin-left: auto;
            flex-shrink: 0;
        }

        /* ─── SUBMENU ─── */
        .submenu {
            margin-left: 24px;
            padding-left: 16px;
            border-left: 2px solid #e5e7eb;
            margin-top: 4px;
            margin-bottom: 4px;
            display: none;
            flex-direction: column;
            gap: 6px;
        }
        .submenu.open { display: flex; }

        .submenu-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 10px 12px;
            border-radius: 10px;
            font-family: var(--font-manrope) !important;
            font-size: 16px !important;
            font-weight: 500;
            color: #666;
            text-decoration: none;
            transition: all 0.3s;
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
            width: 100%;
            position: relative;
            line-height: 1.4;
        }

        .submenu-item:hover { color: var(--text-green); }

        .submenu-item span:not(.sub-icon) {
            font-size: 16px !important;
            font-family: var(--font-manrope) !important;
            line-height: 1.4;
        }

        .submenu-item.active {
            background: linear-gradient(90deg, rgba(255, 213, 124, 0.87) 0%, #FFFFFF 100%);
            color: var(--text-green);
            font-weight: 600;
            cursor: pointer;
        }

        .submenu-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 18px;
            background: var(--amber);
            border-radius: 0 9999px 9999px 0;
        }

        .sub-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
            flex-shrink: 0;
        }
        .sub-icon img { width: 16px; height: 16px; object-fit: contain; }

        /* ─── LOGOUT item ─── */
        .menu-item.logout-item:hover { color: #e53935; }
        .menu-item.logout-item:hover .menu-icon { opacity: 1; }
        .menu-item.logout-item .menu-icon svg { stroke: #aaa; }
        .menu-item.logout-item:hover .menu-icon svg { stroke: #e53935; }

        /* ─── MAIN CONTENT ─── */
        .main-content {
            flex: 1;
            margin-left: 460px;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            background: white;
            scrollbar-width: none;
        }
        .main-content::-webkit-scrollbar { display: none; }

        .main-inner {
            padding: 3rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        /* ─── DROPDOWNS (Notifications / Aide) ─── */
        .dropdown-panel {
            position: fixed;
            top: 80px;
            right: 1.5rem;
            width: 24rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            border: 1px solid var(--gray-200);
            z-index: 110;
            display: none;
            flex-direction: column;
            max-height: calc(100vh - 100px);
        }
        .dropdown-panel.active { display: flex; }

        .dropdown-header {
            padding: 1rem;
            border-bottom: 1px solid var(--gray-200);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .dropdown-header h3 {
            font-size: 1.125rem;
            font-weight: 700;
            color: var(--gray-900);
            font-family: var(--font-merri);
        }

        .dropdown-close {
            padding: 0.5rem;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 0.5rem;
            color: var(--gray-500);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .dropdown-close:hover { background: var(--gray-100); }

        .dropdown-body { flex: 1; overflow-y: auto; }

        .dropdown-footer {
            padding: 1rem;
            border-top: 1px solid var(--gray-200);
            flex-shrink: 0;
            background: var(--gray-50);
        }

        .dropdown-footer button {
            width: 100%;
            padding: 0.75rem;
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 0.75rem;
            font-size: 1rem;
            color: var(--gray-600);
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-merri);
        }
        .dropdown-footer button:hover { color: var(--gray-800); }

        /* ─── NOTIF ITEMS ─── */
        .notif-item {
            padding: 1rem;
            border-bottom: 1px solid var(--gray-100);
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }
        .notif-item:hover { background: var(--gray-50); }
        .notif-item:last-child { border-bottom: none; }

        .notif-dot {
            width: 12px; height: 12px;
            border-radius: 9999px;
            margin-top: 6px;
            flex-shrink: 0;
        }
        .notif-dot.unread { background: #f97316; box-shadow: 0 0 8px rgba(249,115,22,0.5); }
        .notif-dot.read   { background: #d1d5db; }

        .notif-body { flex: 1; }
        .notif-title { font-size: 0.9rem; font-weight: 700; color: var(--gray-900); line-height: 1.3; }
        .notif-title.read { font-weight: 500; color: var(--gray-500); }
        .notif-msg  { font-size: 0.85rem; color: var(--gray-600); margin-top: 2px; }
        .notif-time {
            font-size: 0.75rem; color: var(--gray-400);
            margin-top: 0.5rem; font-weight: 500;
            text-transform: uppercase; letter-spacing: 0.05em;
        }

        .notif-empty { padding: 3rem; text-align: center; }
        .notif-empty p { color: var(--gray-400); font-weight: 500; font-family: var(--font-manrope); }

        /* ─── AIDE ITEMS ─── */
        .help-item {
            padding: 1rem;
            margin: 0.25rem;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
        }
        .help-item:hover { background: var(--gray-50); border-color: var(--gray-100); }

        .help-dot {
            width: 12px; height: 12px;
            border-radius: 9999px;
            margin-top: 8px;
            flex-shrink: 0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .help-item-body { flex: 1; }
        .help-item-title { font-size: 0.95rem; font-weight: 700; color: var(--gray-900); }
        .help-item-desc  { font-size: 0.85rem; color: var(--gray-600); margin-top: 2px; }

        .help-chevron { color: var(--gray-300); flex-shrink: 0; margin-top: 2px; }

        /* ─── LOGOUT MODAL - STYLE REACT AVEC ROUGE ─── */
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay.active { display: flex; }

        .modal-box {
            background: white;
            border-radius: 1.5rem;
            width: 90%; max-width: 420px;
            padding: 2rem;
            text-align: center;
            box-shadow: var(--shadow);
            transform: scale(0.95);
            transition: transform 0.3s;
        }
        .modal-overlay.active .modal-box { transform: scale(1); }

        .logout-icon {
            width: 5rem; height: 5rem;
            border-radius: 9999px;
            margin: 0 auto 1.5rem;
            display: flex; align-items: center; justify-content: center;
            background: #fee2e2;
            border: 3px solid #ef4444;
        }

        .logout-icon svg {
            stroke: #ef4444;
        }

        .logout-title {
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--gray-900);
            margin-bottom: 0.75rem;
            font-family: var(--font-merri);
        }

        .logout-message {
            color: var(--gray-600);
            margin-bottom: 2rem;
            font-family: var(--font-manrope);
            font-size: 0.95rem;
            line-height: 1.6;
        }

        .logout-actions {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
        }

        .logout-btn {
            padding: 0.875rem 2rem;
            border-radius: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            min-width: 130px;
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            font-family: var(--font-merri);
            font-size: 0.9rem;
        }

        .logout-btn-cancel {
            background: var(--gray-100);
            color: var(--gray-700);
            border: 2px solid var(--gray-300);
        }
        .logout-btn-cancel:hover {
            background: var(--gray-200);
        }

        .logout-btn-confirm {
            background: #ef4444;
            color: white;
            border: 2px solid #ef4444;
        }
        .logout-btn-confirm:hover {
            background: #dc2626;
            border-color: #dc2626;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        /* ─── FORM UTILITIES ─── */
        .form-container { min-height: 100vh; background: #fff; padding: 2rem; position: relative; }
        .form-card { max-width: 1200px; margin: 0 auto; background: rgba(255,255,255,.92); border-radius: 22px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid rgba(112,174,72,.18); }
        .form-header { background: linear-gradient(135deg, #70AE48, #8BC34A); padding: 2.5rem; color: white; }
        .form-body { padding: 2.5rem; }
        .section { margin-bottom: 2.5rem; background: rgba(255,255,255,.72); padding: 2rem; border-radius: 16px; border: 1px solid rgba(17,24,39,.08); box-shadow: 0 10px 30px rgba(17,24,39,.06); }
        .form-grid { display: grid; gap: 1.25rem; }
        .form-grid-2 { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-label { font-size: 0.85rem; font-weight: 900; color: #334155; display: flex; align-items: center; gap: 0.35rem; font-family: var(--font-merri); }
        .required { color: #e11d48; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 0.85rem 1rem; border: 2px solid rgba(148,163,184,.35); border-radius: 12px; font-size: 1rem; color: #0f172a; background: rgba(255,255,255,.92); transition: all 0.2s; font-family: var(--font-merri); font-weight: 700; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: rgba(112,174,72,.75); box-shadow: 0 0 0 4px rgba(112,174,72,0.14); }
        .button { padding: 0.9rem 1.35rem; border-radius: 14px; font-weight: 900; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--font-merri); white-space: nowrap; text-decoration: none; }
        .button-primary { background: linear-gradient(135deg, #70AE48, #8BC34A); color: #fff; box-shadow: 0 14px 30px rgba(112,174,72,.22); }
        .button-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 18px 34px rgba(112,174,72,.28); }
        .button-secondary { background: rgba(255,255,255,.92); color: #70AE48; border: 2px solid rgba(112,174,72,.20); }
        .button-danger { background: rgba(255,255,255,.92); color: #e11d48; border: 2px solid rgba(225,29,72,.18); }
        .top-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1.5rem; }
        .top-actions-right { display: flex; gap: .75rem; flex-wrap: wrap; }
        .bottom-actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: 1.5rem; border-top: 2px solid rgba(148,163,184,.35); flex-wrap: wrap; }
        .alert-box { border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid; font-weight: 850; display: flex; align-items: flex-start; gap: 10px; font-family: var(--font-merri); }
        .alert-info { background: rgba(240,249,235,.92); border-color: rgba(112,174,72,.30); color: #2e5e1e; }
        .alert-warning { background: rgba(254,252,232,.92); border-color: rgba(245,158,11,.30); color: #92400e; }
        .alert-error { background: rgba(254,242,242,.92); border-color: rgba(248,113,113,.30); color: #991b1b; }
        .alert-success { background: rgba(240,253,244,.92); border-color: rgba(74,222,128,.30); color: #166534; }
        .hidden { display: none !important; }

        /* ─── CACHE LES SPINNERS SUR TOUS LES INPUT NUMBER ─── */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="number"] {
            -moz-appearance: textfield;
        }
        .input-error { border-color: rgba(225,29,72,.72) !important; box-shadow: 0 0 0 4px rgba(225,29,72,.10) !important; }
        .field-error { display: flex; gap: 8px; align-items: flex-start; color: #be123c; font-weight: 900; font-size: .8rem; line-height: 1.2; margin-top: 2px; font-family: var(--font-merri); }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
            .sidebar {
                position: fixed;
                left: 0; top: 0; bottom: 0;
                width: 320px;
                border-radius: 0;
                max-height: 100vh;
                transform: translateX(-100%);
            }
            .sidebar.active { transform: translateX(0); box-shadow: 10px 0px 30px rgba(0,0,0,0.1); }
            .main-content { margin-left: 0; }
            .mobile-menu-btn { display: flex !important; }
            .header-btn-text { display: none; }
            .header { padding: 0 1rem; }
            .dropdown-panel { right: 0.5rem; width: calc(100vw - 1rem); }
        }

        /* ─── SIDEBAR MOBILE HEADER ─── */
        .sidebar-mobile-header {
            display: none;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid var(--gray-200);
            background: var(--gradient-green);
            flex-shrink: 0;
        }
        .sidebar-mobile-header span {
            font-family: var(--font-merri);
            font-weight: 900;
            font-size: 1.2rem;
            color: white;
        }
        .sidebar-close-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 0.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .sidebar-close-btn:hover { background: rgba(255,255,255,0.35); }

        @media (max-width: 1024px) {
            .sidebar-mobile-header { display: flex; }
        }
    </style>

    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
</head>

<body>

    <!-- OVERLAY MOBILE -->
    <div class="overlay" id="overlay"></div>

    <!-- ─── MODAL DÉCONNEXION (STYLE REACT AVEC ROUGE) ─── -->
    <div class="modal-overlay" id="logoutModal">
        <div class="modal-box">
            <div class="logout-icon">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </div>
            <h3 class="logout-title">Déconnexion</h3>
            <div class="logout-message">
                Êtes-vous sûr de vouloir vous déconnecter ?<br><br>
                Vous devrez vous reconnecter pour accéder à votre espace personnel.<br>
                Toutes les modifications non enregistrées seront perdues.
            </div>
            <div class="logout-actions">
                <button class="logout-btn logout-btn-cancel" onclick="closeLogoutModal()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Annuler
                </button>
                <button class="logout-btn logout-btn-confirm" onclick="confirmLogout()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Se déconnecter
                </button>
            </div>
        </div>
    </div>

    <!-- ─── DROPDOWN NOTIFICATIONS ─── -->
    <div class="dropdown-panel" id="notifPanel">
        <div class="dropdown-header">
            <h3>Notifications</h3>
            <button class="dropdown-close" onclick="closePanel('notifPanel')">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="dropdown-body" id="notifList">
            <div class="notif-empty"><p>Aucune notification</p></div>
        </div>
        <div class="dropdown-footer">
            <button onclick="markAllRead()">Tout marquer lu</button>
        </div>
    </div>

    <!-- ─── DROPDOWN AIDE ─── -->
    <div class="dropdown-panel" id="helpPanel">
        <div class="dropdown-header">
            <h3>Aide & Support</h3>
            <button class="dropdown-close" onclick="closePanel('helpPanel')">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="dropdown-body" style="padding: 0.5rem;">
            <div class="help-item" onclick="window.location.href='/help'">
                <div class="help-dot" style="background:#22c55e;"></div>
                <div class="help-item-body">
                    <div class="help-item-title">Guide de démarrage</div>
                    <div class="help-item-desc">Apprenez les bases de GestiLoc</div>
                </div>
                <svg class="help-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div class="help-item" onclick="window.location.href='/help'">
                <div class="help-dot" style="background:#3b82f6;"></div>
                <div class="help-item-body">
                    <div class="help-item-title">Centre d'aide complet</div>
                    <div class="help-item-desc">Accédez à tous nos guides</div>
                </div>
                <svg class="help-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div class="help-item" onclick="window.location.href='/contact'">
                <div class="help-dot" style="background:#a855f7;"></div>
                <div class="help-item-body">
                    <div class="help-item-title">Contactez le support</div>
                    <div class="help-item-desc">Notre équipe est là pour vous aider</div>
                </div>
                <svg class="help-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        </div>
        <div class="dropdown-footer">
            <button onclick="window.location.href='/help'" style="color: var(--text-green);">Consulter toute l'aide</button>
        </div>
    </div>

    <!-- ─── HEADER ─── -->
    <header class="header">
        <div class="header-left">
            <button class="mobile-menu-btn" id="mobileMenuBtn" onclick="toggleSidebar()">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            </button>
            <span class="header-logo"></span>
        </div>

        <div class="header-right">
            <!-- Notifications -->
            <button class="header-btn" onclick="togglePanel('notifPanel', 'helpPanel')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#FFC107" stroke="#FFC107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span class="header-btn-text">Notifications</span>
                <span class="notif-badge hidden" id="notifBadge">0</span>
            </button>

            <!-- Aide -->
            <button class="header-btn" onclick="togglePanel('helpPanel', 'notifPanel')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span class="header-btn-text">Aide</span>
            </button>

            <!-- Mon compte -->
            <button class="header-btn" onclick="goToReact('/coproprietaire/parametres')">
                <img src="/Ressource_gestiloc/customer.png" alt="Mon compte"
                     style="width:24px;height:24px;border-radius:9999px;object-fit:cover;background:white;">
                <span class="header-btn-text">Mon compte</span>
            </button>
        </div>
    </header>

    <!-- ─── APP BODY ─── -->
    <div class="app-body">

        <!-- ─── SIDEBAR ─── -->
        <aside class="sidebar" id="sidebar">

            <!-- Header mobile -->
            <div class="sidebar-mobile-header">
                <span>Menu</span>
                <button class="sidebar-close-btn" onclick="toggleSidebar()">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <div class="sidebar-scroll">

                <!-- Tableau de bord -->
                <div class="menu-group">
                    <button class="menu-item" data-path="/coproprietaire/dashboard" data-react="true" onclick="goToReact('/coproprietaire/dashboard')">
                        <span class="menu-icon"><img src="/Ressource_gestiloc/tb_locataire.png" alt="Tableau de bord"></span>
                        <span class="menu-item-label">Tableau de bord</span>
                    </button>
                </div>

                <!-- Gestion des biens -->
                <div class="menu-group">
                    <button class="menu-item" onclick="toggleSubmenu('biens-sub', this)">
                        <span class="menu-icon"><img src="/Ressource_gestiloc/Home.png" alt="Biens"></span>
                        <span class="menu-item-label">Gestion des biens</span>
                        <span class="menu-item-chevron" id="biens-sub-chevron">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                    </button>
                    <div class="submenu" id="biens-sub">
                        <button class="submenu-item" data-path="/coproprietaire/biens/create" onclick="navigateTo('/coproprietaire/biens/create')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/Tools.png" alt="Add"></span>
                            <span>Ajouter un bien</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/biens" data-react="true" onclick="goToReact('/coproprietaire/biens')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/Home.png" alt="Mes biens"></span>
                            <span>Mes biens</span>
                        </button>
                    </div>
                </div>

                <!-- Gestion locative -->
                <div class="menu-group">
                    <button class="menu-item" onclick="toggleSubmenu('locative-sub', this)">
                        <span class="menu-icon"><img src="/Ressource_gestiloc/Ma_location.png" alt="Locative"></span>
                        <span class="menu-item-label">Gestion locative</span>
                        <span class="menu-item-chevron" id="locative-sub-chevron">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                    </button>
                    <div class="submenu" id="locative-sub">
                        <button class="submenu-item" data-path="/coproprietaire/assign-property/create" onclick="navigateTo('/coproprietaire/assign-property/create')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/Ma_location.png" alt="New"></span>
                            <span>Nouvelle location</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/tenants/create" onclick="navigateTo('/coproprietaire/tenants/create')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/customer.png" alt="Add"></span>
                            <span>Ajouter un locataire</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/tenants" onclick="navigateTo('/coproprietaire/tenants')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/customer.png" alt="List"></span>
                            <span>Liste des locataires</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/paiements" onclick="navigateTo('/coproprietaire/paiements')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/paiement.png" alt="Payments"></span>
                            <span>Gestion des paiements</span>
                        </button>
                    </div>
                </div>

                <!-- Documents -->
                <div class="menu-group">
                    <button class="menu-item" onclick="toggleSubmenu('docs-sub', this)">
                        <span class="menu-icon"><img src="/Ressource_gestiloc/Document%20In%20Folder.png" alt="Documents"></span>
                        <span class="menu-item-label">Documents</span>
                        <span class="menu-item-chevron" id="docs-sub-chevron">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                    </button>
                    <div class="submenu" id="docs-sub">
                        <button class="submenu-item" data-path="/coproprietaire/leases" onclick="navigateTo('/coproprietaire/leases')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/document.png" alt="Bail"></span>
                            <span>Contrats de bail</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/etats-des-lieux" onclick="navigateTo('/coproprietaire/etats-des-lieux')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/Mes_quittances.png" alt="Etat"></span>
                            <span>Etats de lieux</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/notices" onclick="navigateTo('/coproprietaire/notices')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/document.png" alt="Avis"></span>
                            <span>Préavis</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/avis-echeance" onclick="navigateTo('/coproprietaire/avis-echeance')">
    <span class="sub-icon"><img src="/Ressource_gestiloc/document.png" alt="Avis"></span>
    <span>Avis d'échéance</span>
</button>
                        <button class="submenu-item" data-path="/coproprietaire/quittances" onclick="navigateTo('/coproprietaire/quittances')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/Mes_quittances.png" alt="Quittance"></span>
                            <span>Quittances de loyers</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/factures" onclick="navigateTo('/coproprietaire/factures')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/document.png" alt="Facture"></span>
                            <span>Factures et documents divers</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/documents" data-react="true" onclick="goToReact('/coproprietaire/documents')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/document.png" alt="Archive"></span>
                            <span>Archivage de documents</span>
                        </button>
                    </div>
                </div>

                <!-- Services -->
                <div class="menu-group">
                    <button class="menu-item" onclick="toggleSubmenu('services-sub', this)">
                        <span class="menu-icon"><img src="/Ressource_gestiloc/Tools.png" alt="Services"></span>
                        <span class="menu-item-label">Services</span>
                        <span class="menu-item-chevron" id="services-sub-chevron">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                    </button>
                    <div class="submenu" id="services-sub">
                        <button class="submenu-item" data-path="/coproprietaire/maintenance" onclick="navigateTo('/coproprietaire/maintenance')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/Tools.png" alt="Repairs"></span>
                            <span>Réparations et travaux</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/comptabilite" onclick="navigateTo('/coproprietaire/comptabilite')">
                            <span class="sub-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                                </svg>
                            </span>
                            <span>Comptabilité et statistiques</span>
                        </button>
                    </div>
                </div>

                <!-- Délégation -->
                <div class="menu-group">
                    <button class="menu-item" onclick="toggleSubmenu('coowners-sub', this)">
                        <span class="menu-icon"><img src="/Ressource_gestiloc/customer.png" alt="Gestionnaires"></span>
                        <span class="menu-item-label">Délégation</span>
                        <span class="menu-item-chevron" id="coowners-sub-chevron">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                    </button>
                    <div class="submenu" id="coowners-sub">
                        <button class="submenu-item" data-path="/coproprietaire/gestionnaires" onclick="navigateTo('/coproprietaire/gestionnaires')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/customer.png" alt="List"></span>
                            <span>Liste des gestionnaires</span>
                        </button>
                        <button class="submenu-item" data-path="/coproprietaire/gestionnaires/creer" onclick="navigateTo('/coproprietaire/gestionnaires/creer')">
                            <span class="sub-icon"><img src="/Ressource_gestiloc/customer.png" alt="Invite"></span>
                            <span>Inviter un gestionnaire</span>
                        </button>
                    </div>
                </div>

                <!-- Configuration -->
                <div class="menu-group">
                    <button class="menu-item" onclick="toggleSubmenu('config-sub', this)">
                        <span class="menu-icon">
                            <img src="/Ressource_gestiloc/parametres.png" alt="Config"
                                 onerror="this.src='/Ressource_gestiloc/customer.png'">
                        </span>
                        <span class="menu-item-label">Configuration</span>
                        <span class="menu-item-chevron" id="config-sub-chevron">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                    </button>
                    <div class="submenu" id="config-sub">
                        <button class="submenu-item" data-path="/coproprietaire/parametres" data-react="true" onclick="navigateTo('/coproprietaire/settings')">
                            <span class="sub-icon">
                                <img src="/Ressource_gestiloc/parametres.png" alt="Paramètres"
                                     onerror="this.src='/Ressource_gestiloc/customer.png'">
                            </span>
                            <span>Paramètres</span>
                        </button>
                        <button class="submenu-item logout-item" onclick="showLogoutModal()">
                            <span class="sub-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                            </span>
                            <span style="color:#9ca3af;">Déconnexion</span>
                        </button>
                    </div>
                </div>

            </div><!-- /sidebar-scroll -->
        </aside>

        <!-- ─── MAIN CONTENT ─── -->
        <div class="main-content" id="mainContent">
            <div class="main-inner">
                @yield('content')
            </div>
        </div>

    </div><!-- /app-body -->

    <script>
        const CONFIG = {
            LARAVEL_URL: 'http://localhost:8000',
            REACT_URL:   'http://localhost:8080',
            LOGIN_URL:   '/login',
            LOGOUT_URL:  '/logout'
        };

        // ─── TOKEN ───
        function getToken() {
            let t = localStorage.getItem('token');
            if (t) return t;
            t = new URLSearchParams(window.location.search).get('api_token');
            if (t) { localStorage.setItem('token', t); return t; }
            t = sessionStorage.getItem('token');
            if (t) return t;
            return null;
        }

        function extractTokenFromUrl() {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('api_token');
            if (token) {
                localStorage.setItem('token', token);
                params.delete('api_token');
                const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
                window.history.replaceState({}, '', newUrl);
                return token;
            }
            return null;
        }

        // ─── NAVIGATION ───
        function goToReact(path) {
            const token = getToken();
            if (!token) { window.location.href = CONFIG.LARAVEL_URL + CONFIG.LOGIN_URL; return; }
            const sep = path.includes('?') ? '&' : '?';
            window.location.href = `${CONFIG.REACT_URL}${path.startsWith('/') ? path : '/'+path}${sep}api_token=${encodeURIComponent(token)}&_t=${Date.now()}`;
        }

        function navigateTo(path) {
            const token = getToken();
            if (!token) { window.location.href = CONFIG.LARAVEL_URL + CONFIG.LOGIN_URL; return; }
            const sep = path.includes('?') ? '&' : '?';
            window.location.href = `${CONFIG.LARAVEL_URL}${path.startsWith('/') ? path : '/'+path}${sep}api_token=${encodeURIComponent(token)}&_t=${Date.now()}`;
        }

        // ─── SIDEBAR MOBILE ───
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('overlay').classList.toggle('active');
        }
        document.getElementById('overlay').addEventListener('click', function() {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        });

        // ─── SUBMENUS ───
        function toggleSubmenu(id, btn) {
            const allSubs = document.querySelectorAll('.submenu');
            const allBtns = document.querySelectorAll('.menu-item');

            allSubs.forEach(function(sub) {
                if (sub.id !== id) {
                    const hasActive = sub.querySelector('.submenu-item.active');
                    if (!hasActive) {
                        sub.classList.remove('open');
                        const prevBtn = sub.previousElementSibling;
                        if (prevBtn && prevBtn.classList.contains('menu-item')) {
                            prevBtn.classList.remove('active-parent');
                            const svg = prevBtn.querySelector('.menu-item-chevron svg');
                            if (svg) svg.style.transform = 'rotate(0deg)';
                        }
                    }
                }
            });

            const sub = document.getElementById(id);
            const chevronWrapper = btn.querySelector('.menu-item-chevron');
            const isOpen = sub.classList.contains('open');

            sub.classList.toggle('open');

            if (chevronWrapper) {
                const svg = chevronWrapper.querySelector('svg');
                if (svg) {
                    svg.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                    svg.style.transition = 'transform 0.3s';
                }
            }

            if (!isOpen) {
                btn.classList.add('active-parent');
            } else {
                const hasActiveChild = sub.querySelector('.submenu-item.active');
                if (!hasActiveChild) btn.classList.remove('active-parent');
            }
        }

        // ─── DROPDOWNS ───
        function togglePanel(id, otherId) {
            const panel = document.getElementById(id);
            const other = document.getElementById(otherId);
            other.classList.remove('active');
            panel.classList.toggle('active');
        }

        function closePanel(id) {
            document.getElementById(id).classList.remove('active');
        }

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown-panel') && !e.target.closest('.header-btn')) {
                document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('active'));
            }
        });

        // ─── NOTIFICATIONS ───
        function loadNotifications() {
            const token = getToken();
            if (!token) return;

            fetch(`${CONFIG.LARAVEL_URL}/coproprietaire/notifications`, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(r => r.json())
            .then(data => {
                const notifs = data.notifications || data.data || [];
                renderNotifications(notifs);
            })
            .catch(() => {
                // Silencieux en cas d'erreur
            });
        }

        function renderNotifications(notifs) {
            const list = document.getElementById('notifList');
            const badge = document.getElementById('notifBadge');
            const unread = notifs.filter(n => !n.is_read);

            if (notifs.length === 0) {
                list.innerHTML = '<div class="notif-empty"><p>Aucune notification</p></div>';
            } else {
                list.innerHTML = notifs.map(n => `
                    <div class="notif-item" onclick="markAsRead('${n.id}')">
                        <div class="notif-dot ${n.is_read ? 'read' : 'unread'}"></div>
                        <div class="notif-body">
                            <div class="notif-title ${n.is_read ? 'read' : ''}">${n.title || n.message || ''}</div>
                            ${n.message && n.title ? `<div class="notif-msg">${n.message}</div>` : ''}
                            <div class="notif-time">${new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                `).join('');
            }

            badge.textContent = unread.length;
            unread.length > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
        }

        function markAsRead(id) {
            const token = getToken();
            if (!token) return;
            fetch(`${CONFIG.LARAVEL_URL}/coproprietaire/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(() => loadNotifications()).catch(() => {});
        }

        function markAllRead() {
            const token = getToken();
            if (!token) return;
            fetch(`${CONFIG.LARAVEL_URL}/coproprietaire/notifications/read-all`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(() => loadNotifications()).catch(() => {});
        }

        // ─── LOGOUT ───
        function showLogoutModal() {
            document.getElementById('logoutModal').classList.add('active');
        }

        function closeLogoutModal() {
            document.getElementById('logoutModal').classList.remove('active');
        }

        function confirmLogout() {
            // Nettoyer le stockage local
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');

            // Redirection vers la route de déconnexion
            window.location.href = CONFIG.LARAVEL_URL + CONFIG.LOGOUT_URL;
        }

        document.getElementById('logoutModal').addEventListener('click', function(e) {
            if (e.target === this) closeLogoutModal();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeLogoutModal();
        });

        // ─── MENU ACTIF ───
        function markActiveMenu() {
            const currentPath = window.location.pathname;

            // 1. Réinitialiser tous les états actifs
            document.querySelectorAll('.menu-item.active, .menu-item.active-parent').forEach(item => {
                item.classList.remove('active', 'active-parent');
            });
            document.querySelectorAll('.submenu-item.active').forEach(item => {
                item.classList.remove('active');
            });

            // Fermer tous les sous-menus
            document.querySelectorAll('.submenu.open').forEach(sub => {
                sub.classList.remove('open');
                const chevron = sub.previousElementSibling?.querySelector('.menu-item-chevron svg');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            });

            let bestMatch = null;
            let bestMatchType = ''; // 'exact', 'startsWith'
            let bestMatchLength = 0;

            // 2. Collecter tous les items avec data-path
            const allItems = [
                ...document.querySelectorAll('.menu-item[data-path]'),
                ...document.querySelectorAll('.submenu-item[data-path]')
            ];

            // 3. Trouver le meilleur match unique
            for (const item of allItems) {
                const path = item.dataset.path;
                if (!path) continue;

                // Match exact (priorité maximale)
                if (currentPath === path) {
                    if (bestMatchType !== 'exact' || path.length > bestMatchLength) {
                        bestMatch = item;
                        bestMatchType = 'exact';
                        bestMatchLength = path.length;
                    }
                }
                // Match par début de chemin (uniquement si pas de match exact trouvé)
                else if (bestMatchType !== 'exact' && path !== '/' && currentPath.startsWith(path + '/')) {
                    // Choisir le chemin le plus long (plus spécifique)
                    if (path.length > bestMatchLength) {
                        bestMatch = item;
                        bestMatchType = 'startsWith';
                        bestMatchLength = path.length;
                    }
                }
            }

            // 4. Appliquer la classe active uniquement au meilleur match
            if (bestMatch) {
                bestMatch.classList.add('active');

                // Si c'est un sous-menu item, ouvrir son parent
                if (bestMatch.classList.contains('submenu-item')) {
                    const parentSub = bestMatch.closest('.submenu');
                    if (parentSub) {
                        parentSub.classList.add('open');
                        const parentBtn = parentSub.previousElementSibling;
                        if (parentBtn && parentBtn.classList.contains('menu-item')) {
                            parentBtn.classList.add('active-parent');
                            const chevronSvg = parentBtn.querySelector('.menu-item-chevron svg');
                            if (chevronSvg) {
                                chevronSvg.style.transform = 'rotate(180deg)';
                            }
                        }
                    }
                }
            }
        }

        // ─── RESPONSIVE ───
        function checkMobile() {
            const btn = document.getElementById('mobileMenuBtn');
            if (btn) btn.style.display = window.innerWidth <= 1024 ? 'flex' : 'none';
        }
        window.addEventListener('resize', checkMobile);

        // ─── INIT ───
        document.addEventListener('DOMContentLoaded', function() {
            extractTokenFromUrl();
            markActiveMenu();
            checkMobile();
            loadNotifications();
            setInterval(loadNotifications, 60000);
        });

        document.addEventListener('submit', function(e) {
            var form = e.target;
            if (form.method && form.method.toUpperCase() === 'POST') {
                var token = getToken();
                if (token && !form.querySelector('input[name="api_token"]')) {
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'api_token';
                    input.value = token;
                    form.appendChild(input);
                }
            }
        });
    </script>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    </script>
</body>
</html>
