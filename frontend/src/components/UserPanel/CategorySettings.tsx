import { useState } from "react";
import { Pencil, Palette } from "lucide-react";
import ModalBase from "../ModalBase";

interface Category {
  name: string;
  color: string;
}

export default function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#000000");
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    setCategories([
      ...categories,
      { name: newCategory, color: newCategoryColor },
    ]);
    setNewCategory("");
  };

  const handleSaveEdit = () => {
    if (!editCategory) return;
    setCategories(
      categories.map((c) => (c.name === editCategory.name ? editCategory : c))
    );
    setEditCategory(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
      {/* <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Palette size={20} /> Configuração de Categorias
      </h3> */}

      <h3 className="text-lg font-semibold mb-3">
        <Palette size={20} /> Configuração de Categorias
      </h3>

      <hr className="py-2 border-[#334155]"></hr>

      {/* Criar categoria */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="input input-bordered flex-1"
          placeholder="Nome da categoria"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          style={{ color: newCategoryColor }}
        />
        <input
          type="color"
          className="w-12 h-12 rounded"
          value={newCategoryColor}
          onChange={(e) => setNewCategoryColor(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAddCategory}>
          Adicionar
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-slate-500">Nenhuma categoria criada.</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {categories.map((cat) => (
            <li
              key={cat.name}
              className="flex items-center justify-between py-2"
            >
              <span style={{ color: cat.color }} className="font-medium">
                {cat.name}
              </span>
              <span className="text-xs px-2 py-1 border rounded">
                {cat.color}
              </span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => setEditCategory({ ...cat })}
              >
                <Pencil size={14} /> Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de edição */}
      <ModalBase
        open={Boolean(editCategory)}
        onClose={() => setEditCategory(null)}
        maxWidth="sm"
        labelledBy="titulo-editar-categoria"
      >
        <h4 id="titulo-editar-categoria" className="font-bold mb-4">
          Editar Categoria
        </h4>
        {editCategory && (
          <>
            <input
              type="text"
              className="input input-bordered w-full mb-2"
              value={editCategory.name}
              onChange={(e) =>
                setEditCategory({ ...editCategory, name: e.target.value })
              }
              style={{ color: editCategory.color }}
            />
            <input
              type="color"
              className="w-12 h-12 rounded mb-4"
              value={editCategory.color}
              onChange={(e) =>
                setEditCategory({ ...editCategory, color: e.target.value })
              }
            />
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => setEditCategory(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Salvar
              </button>
            </div>
          </>
        )}
      </ModalBase>
    </div>
  );
}
