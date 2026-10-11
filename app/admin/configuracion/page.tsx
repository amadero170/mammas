"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag, Layers, MapPin, Search, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getTags,
  createTag,
  deleteTag,
  renameTag,
  getDismissedTagPairs,
  dismissTagPair,
  getCategories,
  createCategory,
  deleteCategory,
  renameCategory,
  getZones,
  createZone,
  deleteZone,
  renameZone,
  type TagItem,
  type CategoryItem,
  type ZoneItem,
} from "@/app/actions/configuracion";
import { ConfirmActionModal } from "@/components/confirm-action-modal";
import { closestTag, tagPairKey } from "@/lib/utils";

export default function ConfiguracionAdminPage() {
  const [activeTab, setActiveTab] = useState("tags");

  // ── Tags State ──
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagsTipo, setTagsTipo] = useState<"provider" | "event">("provider");
  const [tagsSearch, setTagsSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);
  const [dismissedPairs, setDismissedPairs] = useState<Set<string>>(new Set());
  const [onlySimilar, setOnlySimilar] = useState(false);

  // ── Categories State ──
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesTipo, setCategoriesTipo] = useState<"provider" | "event">("provider");
  const [categoriesSearch, setCategoriesSearch] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);

  // ── Zones State ──
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [zonesSearch, setZonesSearch] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [loadingZones, setLoadingZones] = useState(false);

  // Load Data
  const loadTags = async () => {
    setLoadingTags(true);
    const [res, dismissedRes] = await Promise.all([getTags(tagsTipo), getDismissedTagPairs(tagsTipo)]);
    if (res.success) setTags(res.tags);
    else toast.error("Error al cargar tags", { description: res.error });
    setDismissedPairs(new Set(dismissedRes.success ? dismissedRes.pares : []));
    setLoadingTags(false);
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    const res = await getCategories(categoriesTipo);
    if (res.success) setCategories(res.categories);
    else toast.error("Error al cargar categorías", { description: res.error });
    setLoadingCategories(false);
  };

  const loadZones = async () => {
    setLoadingZones(true);
    const res = await getZones();
    if (res.success) setZones(res.zones);
    else toast.error("Error al cargar zonas", { description: res.error });
    setLoadingZones(false);
  };

  useEffect(() => {
    if (activeTab === "tags") loadTags();
    if (activeTab === "categorias") loadCategories();
    if (activeTab === "zonas") loadZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tagsTipo, categoriesTipo]);

  // ── Tags Handlers ──
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const res = await createTag(newTagName, tagsTipo);
    if (res.success) {
      toast.success(`Tag "${newTagName.trim()}" creado`);
      setNewTagName("");
      loadTags();
    } else {
      toast.error("No se pudo crear el tag", { description: res.error });
    }
  };

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    action: async () => {},
  });

  const handleDeleteTag = (id: string, nombre: string) => {
    setConfirmModal({
      open: true,
      title: "Eliminar tag",
      description: `¿Seguro que deseas eliminar el tag "${nombre}"?`,
      action: async () => {
        const res = await deleteTag(id);
        if (res.success) {
          toast.success(`Tag "${nombre}" eliminado`);
          loadTags();
        } else {
          toast.error("No se pudo eliminar", { description: res.error });
        }
        setConfirmModal((c) => ({ ...c, open: false }));
      },
    });
  };

  // ── Categories Handlers ──
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const res = await createCategory(newCatName, categoriesTipo);
    if (res.success) {
      toast.success(`Categoría "${newCatName.trim()}" creada`);
      setNewCatName("");
      loadCategories();
    } else {
      toast.error("No se pudo crear la categoría", { description: res.error });
    }
  };

  const handleDeleteCategory = (id: string, nombre: string) => {
    setConfirmModal({
      open: true,
      title: "Eliminar categoría",
      description: `¿Seguro que deseas eliminar la categoría "${nombre}"?`,
      action: async () => {
        const res = await deleteCategory(id);
        if (res.success) {
          toast.success(`Categoría "${nombre}" eliminada`);
          loadCategories();
        } else {
          toast.error("No se pudo eliminar", { description: res.error });
        }
        setConfirmModal((c) => ({ ...c, open: false }));
      },
    });
  };

  // ── Zones Handlers ──
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    const res = await createZone(newZoneName);
    if (res.success) {
      toast.success(`Zona "${newZoneName.trim()}" creada`);
      setNewZoneName("");
      loadZones();
    } else {
      toast.error("No se pudo crear la zona", { description: res.error });
    }
  };

  const handleDeleteZone = (id: string, nombre: string) => {
    setConfirmModal({
      open: true,
      title: "Eliminar zona",
      description: `¿Seguro que deseas eliminar la zona "${nombre}"?`,
      action: async () => {
        const res = await deleteZone(id);
        if (res.success) {
          toast.success(`Zona "${nombre}" eliminada`);
          loadZones();
        } else {
          toast.error("No se pudo eliminar", { description: res.error });
        }
        setConfirmModal((c) => ({ ...c, open: false }));
      },
    });
  };

  // ── Rename (tags, categorías y zonas) ──
  const [renameTarget, setRenameTarget] = useState<{
    kind: "tag" | "categoria" | "zona";
    id: string;
    nombre: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const openRename = (kind: "tag" | "categoria" | "zona", id: string, nombre: string, value = nombre) => {
    setRenameTarget({ kind, id, nombre });
    setRenameValue(value);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    setRenaming(true);
    const res =
      renameTarget.kind === "tag"
        ? await renameTag(renameTarget.id, renameValue)
        : renameTarget.kind === "categoria"
          ? await renameCategory(renameTarget.id, renameValue)
          : await renameZone(renameTarget.id, renameValue);
    setRenaming(false);
    if (res.success) {
      toast.success(
        "merged" in res && res.merged
          ? `"${renameTarget.nombre}" se fusionó con "${renameValue.trim()}"`
          : `"${renameTarget.nombre}" ahora se llama "${renameValue.trim()}"`
      );
      setRenameTarget(null);
      if (renameTarget.kind === "tag") loadTags();
      else if (renameTarget.kind === "categoria") loadCategories();
      else loadZones();
    } else {
      toast.error("No se pudo renombrar", { description: res.error });
    }
  };

  // Tags que parecen un error de dedo de otro tag (ej: "Esscuela" ~ "Escuela")
  const similarTags = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tags) {
      const match = closestTag(
        t.nombre,
        tags.filter((o) => o.id !== t.id).map((o) => o.nombre),
        dismissedPairs
      );
      if (match) map[t.id] = match;
    }
    return map;
  }, [tags, dismissedPairs]);

  const handleDismissSimilar = async (nombre: string, parecido: string) => {
    const res = await dismissTagPair(tagsTipo, nombre, parecido);
    if (res.success) {
      setDismissedPairs((prev) => new Set(prev).add(tagPairKey(nombre, parecido)));
      toast.success(`No se volverá a sugerir fusionar "${nombre}" con "${parecido}"`);
    } else {
      toast.error("No se pudo descartar la sugerencia", { description: res.error });
    }
  };

  // Filtered lists
  const similarCount = Object.keys(similarTags).length;
  const filteredTags = tags.filter(
    (t) =>
      t.nombre.toLowerCase().includes(tagsSearch.toLowerCase()) &&
      // Si ya no quedan sugerencias, mostrar todos aunque el filtro siga activo
      (!onlySimilar || similarCount === 0 || !!similarTags[t.id])
  );
  const filteredCategories = categories.filter((c) =>
    c.nombre.toLowerCase().includes(categoriesSearch.toLowerCase())
  );
  const filteredZones = zones.filter((z) =>
    z.nombre.toLowerCase().includes(zonesSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-aller text-3xl font-bold text-[#2e1b40]">
          Configuración del Sistema
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión dinámica de Tags, Categorías y Zonas para Proveedores y Eventos.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60">
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="zonas" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Zonas
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════
           TAGS TAB
           ══════════════════════════════════════════════════════════ */}
        <TabsContent value="tags" className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter by tipo */}
            <div className="flex items-center gap-2">
              <Button
                variant={tagsTipo === "provider" ? "default" : "outline"}
                size="sm"
                className={tagsTipo === "provider" ? "bg-[#4c2f92]" : ""}
                onClick={() => setTagsTipo("provider")}
              >
                Tags de Proveedores
              </Button>
              <Button
                variant={tagsTipo === "event" ? "default" : "outline"}
                size="sm"
                className={tagsTipo === "event" ? "bg-[#4c2f92]" : ""}
                onClick={() => setTagsTipo("event")}
              >
                Tags de Eventos
              </Button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tag..."
                value={tagsSearch}
                onChange={(e) => setTagsSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Form to create Tag */}
          <form onSubmit={handleCreateTag} className="flex items-center gap-3">
            <Input
              placeholder={`Nuevo tag de ${tagsTipo === "provider" ? "proveedores" : "eventos"}...`}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit" className="bg-[#4c2f92] hover:bg-[#3d2575]">
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </form>

          {/* Tags List */}
          {loadingTags ? (
            <div className="py-12 text-center text-muted-foreground">Cargando tags...</div>
          ) : filteredTags.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron tags.
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Total: {filteredTags.length} tags
                </span>
                {(similarCount > 0 || onlySimilar) && (
                  <Button
                    size="sm"
                    variant={onlySimilar ? "default" : "outline"}
                    onClick={() => setOnlySimilar((v) => !v)}
                    className={onlySimilar ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700 hover:bg-amber-50"}
                  >
                    {onlySimilar ? "Ver todos" : `Solo con sugerencia (${similarCount})`}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={`flex items-center gap-1.5 py-1 pl-3 pr-1 text-sm transition-colors ${
                      similarTags[tag.id]
                        ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span>{tag.nombre}</span>
                    {similarTags[tag.id] && (
                      <button
                        onClick={() => openRename("tag", tag.id, tag.nombre, similarTags[tag.id])}
                        className="rounded-full px-1.5 text-xs font-normal text-amber-700 hover:bg-amber-200"
                        title={`Parecido a "${similarTags[tag.id]}". Clic para fusionar.`}
                      >
                        ¿= {similarTags[tag.id]}?
                      </button>
                    )}
                    {similarTags[tag.id] && (
                      <button
                        onClick={() => handleDismissSimilar(tag.nombre, similarTags[tag.id])}
                        className="rounded-full p-1 text-amber-700 hover:bg-amber-200"
                        title="No son lo mismo: no volver a sugerir"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => openRename("tag", tag.id, tag.nombre)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-purple-100 hover:text-[#4c2f92] transition-colors"
                      title="Renombrar o fusionar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id, tag.nombre)}
                      className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Eliminar tag"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════
           CATEGORÍAS TAB
           ══════════════════════════════════════════════════════════ */}
        <TabsContent value="categorias" className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={categoriesTipo === "provider" ? "default" : "outline"}
                size="sm"
                className={categoriesTipo === "provider" ? "bg-[#4c2f92]" : ""}
                onClick={() => setCategoriesTipo("provider")}
              >
                Categorías de Proveedores
              </Button>
              <Button
                variant={categoriesTipo === "event" ? "default" : "outline"}
                size="sm"
                className={categoriesTipo === "event" ? "bg-[#4c2f92]" : ""}
                onClick={() => setCategoriesTipo("event")}
              >
                Categorías de Eventos
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categoría..."
                value={categoriesSearch}
                onChange={(e) => setCategoriesSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Form to create Category */}
          <form onSubmit={handleCreateCategory} className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Nombre de categoría..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button type="submit" className="bg-[#4c2f92] hover:bg-[#3d2575]">
              <Plus className="mr-2 h-4 w-4" /> Crear Categoría
            </Button>
          </form>

          {/* Categories List */}
          {loadingCategories ? (
            <div className="py-12 text-center text-muted-foreground">Cargando categorías...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron categorías.
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{cat.nombre}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRename("categoria", cat.id, cat.nombre)}
                          className="text-[#4c2f92] hover:bg-purple-50"
                          title="Renombrar categoría"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════
           ZONAS TAB
           ══════════════════════════════════════════════════════════ */}
        <TabsContent value="zonas" className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Zonas de Bahía y Alrededores
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar zona..."
                value={zonesSearch}
                onChange={(e) => setZonesSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Form to create Zone */}
          <form onSubmit={handleCreateZone} className="flex items-center gap-3">
            <Input
              placeholder="Nueva zona..."
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit" className="bg-[#4c2f92] hover:bg-[#3d2575]">
              <Plus className="mr-2 h-4 w-4" /> Agregar Zona
            </Button>
          </form>

          {/* Zones List */}
          {loadingZones ? (
            <div className="py-12 text-center text-muted-foreground">Cargando zonas...</div>
          ) : filteredZones.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron zonas.
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Total: {filteredZones.length} zonas
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredZones.map((z) => (
                  <div
                    key={z.id}
                    className="flex items-center justify-between rounded-md border p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-foreground">{z.nombre}</span>
                    <div className="flex items-center gap-1">
                    <button
                      onClick={() => openRename("zona", z.id, z.nombre)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-purple-100 hover:text-[#4c2f92] transition-colors"
                      title="Renombrar zona"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(z.id, z.nombre)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Eliminar zona"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>
                Renombrar {renameTarget?.kind === "tag" ? "tag" : renameTarget?.kind === "categoria" ? "categoría" : "zona"}
              </DialogTitle>
              <DialogDescription>
                {renameTarget?.kind === "tag"
                  ? `"${renameTarget.nombre}" se cambiará en todos los proveedores y eventos que lo usan. Si escribes el nombre de un tag que ya existe, se fusionan en uno.`
                  : "Se actualizará también en todos los proveedores y eventos que la usan."}
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="my-4"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={renaming}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#4c2f92] hover:bg-[#3d2575]"
                disabled={renaming || !renameValue.trim() || renameValue.trim() === renameTarget?.nombre}
              >
                {renaming ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((c) => ({ ...c, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        variant="destructive"
        onConfirm={confirmModal.action}
      />
    </div>
  );
}
