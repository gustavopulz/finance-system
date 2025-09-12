import React from "react";

const MaintenancePage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200">
      <h1 className="text-6xl font-bold mb-4">Em manutenção :(</h1>
      <p className="text-xl mb-6 text-center">O Finance System está desativado para o lançamento de uma nova versão.<br />Aguarde, voltamos em breve.</p>
      <style>{`
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
);

export default MaintenancePage;