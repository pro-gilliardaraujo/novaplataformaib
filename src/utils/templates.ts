export const getDefaultTabContent = () => `
<div class="flex flex-col h-full">
  <!-- Cabeçalho -->
  <div class="flex items-center justify-between p-4 border-b">
    <h1 class="text-2xl font-bold">Título da Aba</h1>
  </div>

  <!-- Conteúdo Principal -->
  <div class="flex-1 p-4 overflow-auto">
    <div class="bg-white rounded-lg shadow">
      <div class="p-4">
        <!-- Conteúdo da aba aqui -->
        <p>Conteúdo da aba</p>
      </div>
    </div>
  </div>
</div>
`

export const getMainIframeContent = () => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Inter, system-ui, -apple-system, sans-serif;
    }
    .container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #111827;
    }
    .content {
      flex: 1;
      padding: 1rem;
      overflow: auto;
    }
    .card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card-body {
      padding: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Título da Página</h1>
    </div>
    <div class="content">
      <div class="card">
        <div class="card-body">
          <p>Conteúdo da página</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
` 