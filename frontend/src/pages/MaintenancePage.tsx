import React from "react";

const MaintenancePage: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 rounded shadow-md text-center">
      <h1 className="text-3xl font-bold mb-4">Em manutenção :(</h1>
      <p className="text-lg">O Finance Systeme está desativado para o lançamento de uma nova versão.<br />Aguarde, voltamos em breve.</p>
    </div>
  </div>
);

export default MaintenancePage;
