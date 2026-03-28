<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IMONA - Gestion locative</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        body { margin: 0; padding: 0; background-color: #ffffff; }
        #root { min-height: 100vh; background-color: #ffffff; }
    </style>
</head>
<body>
    <div id="root"></div>
    @php $user = auth()->user(); @endphp
    <script>
        window.Laravel = {
            csrfToken: "{{ csrf_token() }}",
            user: @json($user),
            roles: @json($user?->getRoleNames() ?? []),
            appName: "{{ config('app.name') }}",
            appUrl: "{{ config('app.url') }}"
        };
    </script>
    <script>
        // Charger les assets React depuis le dossier dist
        fetch('/assets/manifest.json')
            .catch(() => {});
    </script>
    <script type="module" src="/assets/index-CxuQAH_v.js"></script>
    <link rel="stylesheet" href="/assets/index-Cv_2D9AS.css">
</body>
</html>
