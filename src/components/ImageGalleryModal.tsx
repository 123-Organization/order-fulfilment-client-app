import React, { useEffect, useState, useCallback, useRef } from "react";
import { Spin, Empty, Pagination } from "antd";
import { SearchOutlined, LoadingOutlined, PictureOutlined } from "@ant-design/icons"; // PictureOutlined kept for empty/error states
import { useAppDispatch, useAppSelector } from "../store";
import { getAllImages } from "../store/features/productSlice";
import MultiUploadModal from "./MultiUploadModal";

const BRAND = "#07a3c3";
const BRAND_DARK = "#058fa8";

interface GalleryImage {
  id: number;
  guid: string;
  title: string;
  description: string;
  public_thumbnail_uri: string;
  public_preview_uri: string;
  private_hires_uri: string;
  pix_w: number;
  pix_h: number;
  file_size: number;
  date_added: string;
  active: boolean;
}

interface ImageGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelect: (image: GalleryImage) => void;
  title?: string;
}

const PER_PAGE = 24;

const formatFileSize = (bytes: number) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const checkerBg = `repeating-conic-gradient(#e2e6eb 0% 25%, #f0f2f5 0% 50%) 0 0 / 18px 18px`;
const plainBg = "#f0f2f5";

const isTransparentFormat = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ext === "png" || ext === "webp" || ext === "svg" || ext === "gif";
};

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  visible,
  onClose,
  onImageSelect,
  title = "Select an Image",
}) => {
  const dispatch = useAppDispatch();
  const images = useAppSelector((s) => s.ProductSlice.images) as GalleryImage[];
  const imagesCount = useAppSelector((s) => s.ProductSlice.imagesCount);
  const imagesStatus = useAppSelector((s) => s.ProductSlice.imagesStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [activeLibrary, setActiveLibrary] = useState<"temporary" | "inventory">("temporary");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  

  const fetchImages = useCallback(
    (page: number, search: string, library: "temporary" | "inventory" = activeLibrary) =>
      dispatch(getAllImages({ page, perPage: PER_PAGE, search, libraryName: library, customerId: customerInfo.data.account_id })),
    [dispatch, activeLibrary]
  );

  useEffect(() => {
    if (visible) {
      setCurrentPage(1); setSelectedImage(null);
      setImgErrors({}); setSearchValue("");
      setActiveLibrary("temporary");
      fetchImages(1, "", "temporary");
    }
  }, [visible]);

  useEffect(() => { if (visible) fetchImages(currentPage, searchValue); }, [currentPage]);

  const handleSearch = (value: string) => {
    setSearchValue(value); setCurrentPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchImages(1, value), 400);
  };

  const handleLibrarySwitch = (library: "temporary" | "inventory") => {
    if (library === activeLibrary) return;
    setActiveLibrary(library);
    setCurrentPage(1);
    setSelectedImage(null);
    setSearchValue("");
    dispatch(getAllImages({ page: 1, perPage: PER_PAGE, search: "", libraryName: library, customerId: customerInfo.data.account_id }));
  };

  const handleConfirm = () => {
    if (selectedImage) { onImageSelect(selectedImage); setSelectedImage(null); onClose(); }
  };

  if (!visible) return null;

  const isLoading = imagesStatus === "loading";
  const totalPages = Math.ceil(imagesCount / PER_PAGE);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,16,36,.68)", backdropFilter: "blur(8px)", padding: 20, animation: "gwFadeIn .18s ease" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes gwFadeIn  { from{opacity:0}          to{opacity:1} }
        @keyframes gwSlideUp { from{opacity:0;transform:translateY(26px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes gwPop     { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        .gw-scroll::-webkit-scrollbar       { width:5px }
        .gw-scroll::-webkit-scrollbar-track { background:transparent }
        .gw-scroll::-webkit-scrollbar-thumb { background:#cdd4df;border-radius:4px }
        .gw-card { transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease; }
        .gw-card:hover:not(.selected) {
          box-shadow:0 10px 30px rgba(0,0,0,.12)!important;
          transform:translateY(-3px)!important;
        }
        .gw-card:hover .gw-img { transform:scale(1.05); }
        .gw-img { transition:transform .3s ease; }
        .gw-card:hover .gw-hover-ring { opacity:1!important; }
        .ant-pagination-item { background: rgba(255,255,255,0.5)!important; border: 1px solid rgba(255,255,255,0.8)!important; border-radius: 8px!important; transition: all 0.2s; }
        .ant-pagination-item:hover { border-color: ${BRAND}!important; background: rgba(255,255,255,0.8)!important; }
        .ant-pagination-item-active { border-color:${BRAND}!important; background: rgba(7,163,195,0.15)!important; }
        .ant-pagination-item-active a { color:${BRAND}!important; font-weight: 700!important; }
        .ant-pagination-prev .ant-pagination-item-link, .ant-pagination-next .ant-pagination-item-link { background: rgba(255,255,255,0.5)!important; border: 1px solid rgba(255,255,255,0.8)!important; border-radius: 8px!important; color: #4b5563!important; transition: all 0.2s; }
        .ant-pagination-prev:not(.ant-pagination-disabled):hover .ant-pagination-item-link, .ant-pagination-next:not(.ant-pagination-disabled):hover .ant-pagination-item-link { border-color: ${BRAND}!important; color: ${BRAND}!important; background: rgba(255,255,255,0.8)!important; }
      `}</style>

      <div
        style={{ position: "relative", background: "#fff", borderRadius: 20, width: "100%", maxWidth: 1200, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.06)", animation: "gwSlideUp .22s cubic-bezier(.25,.8,.25,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ background: `linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%)`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
          {/* Left: Library tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,.15)", borderRadius: 12, padding: 4 }}>
            {(["temporary", "inventory"] as const).map((lib) => {
              const isActive = activeLibrary === lib;
              return (
                <button
                  key={lib}
                  onClick={() => handleLibrarySwitch(lib)}
                  style={{
                    padding: "7px 20px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 600,
                    cursor: "pointer",
                    transition: "all .2s ease",
                    letterSpacing: 0.2,
                    textTransform: "capitalize",
                    ...(isActive
                      ? { background: "rgba(255,255,255,.95)", color: BRAND, boxShadow: "0 2px 8px rgba(0,0,0,.18)" }
                      : { background: "transparent", color: "rgba(255,255,255,.78)" }),
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.78)"; }}
                >
                  {lib === "temporary" ? "Temporary" : "Inventory"}
                </button>
              );
            })}
          </div>

          {/* Right: Upload + Search + Close */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setUploadModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.45)", background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(6px)", transition: "all .18s ease", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.32)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.7)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.18)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.45)"; }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload
            </button>

            <div style={{ position: "relative" }}>
              <SearchOutlined style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: BRAND, fontSize: 14, pointerEvents: "none" }} />
              <input
                placeholder="Search images…"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: searchValue ? 30 : 14, paddingTop: 9, paddingBottom: 9, width: 220, borderRadius: 10, border: "none", background: "#fff", color: "#1e2a3b", fontSize: 14, outline: "none" }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              />
              {searchValue && (
                <button onClick={() => handleSearch("")} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>

            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,.16)", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 300 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.3)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.16)")}
            >×</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div ref={bodyRef} className="gw-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 120px", background: "#f5f7fa" }}>
          {isLoading ? (
            <div style={{ height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: BRAND }} spin />} />
              <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>Loading your images…</span>
            </div>
          ) : images.length === 0 ? (
            <div style={{ height: 460, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: "#9ca3af" }}>{searchValue ? `No images match "${searchValue}"` : "No images in your library yet"}</span>} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 16 }}>
              {images.map((image) => {
                const isSelected = selectedImage?.id === image.id;
                const isHovered = hoveredId === image.id;
                const hasError = imgErrors[image.id];
                const useBg = isTransparentFormat(image.title) ? checkerBg : plainBg;

                return (
                  <div
                    key={image.id}
                    className={`gw-card${isSelected ? " selected" : ""}`}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isSelected ? `2.5px solid ${BRAND}` : "2px solid transparent",
                      boxShadow: isSelected
                        ? `0 0 0 4px rgba(7,163,195,.16), 0 8px 28px rgba(7,163,195,.18)`
                        : "0 2px 10px rgba(0,0,0,.07)",
                      transform: isSelected ? "translateY(-4px)" : "none",
                      display: "flex", flexDirection: "column",
                    }}
                    onClick={() => setSelectedImage(isSelected ? null : image)}
                    onMouseEnter={() => setHoveredId(image.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* ── Image area ── */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 200,                  /* taller image */
                        background: useBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 14,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {hasError ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#c8d0da" }}>
                          <PictureOutlined style={{ fontSize: 36 }} />
                          <span style={{ fontSize: 11, color: "#b0bac6" }}>No preview</span>
                        </div>
                      ) : (
                        <img
                          className="gw-img"
                          src={image.public_thumbnail_uri}
                          alt={image.title}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", borderRadius: 4, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.13))" }}
                          onError={() => setImgErrors((p) => ({ ...p, [image.id]: true }))}
                        />
                      )}

                      {/* ── Hover ring hint ── */}
                      <div
                        className="gw-hover-ring"
                        style={{
                          position: "absolute", inset: 0,
                          border: `2.5px solid ${BRAND}`,
                          borderRadius: "inherit",
                          opacity: isHovered && !isSelected ? .45 : 0,
                          transition: "opacity .2s",
                          pointerEvents: "none",
                        }}
                      />

                      {/* ── Selected overlay — full teal wash + centred tick ── */}
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute", inset: 0,
                            background: "rgba(7,163,195,.22)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "inherit",
                          }}
                        >
                          {/* big animated checkmark circle */}
                          <div
                            style={{
                              width: 54, height: 54,
                              background: `linear-gradient(135deg,${BRAND},${BRAND_DARK})`,
                              borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 6px 20px rgba(7,163,195,.55)",
                              animation: "gwPop .25s cubic-bezier(.34,1.56,.64,1) both",
                            }}
                          >
                            <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="2.8" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Dimensions badge */}
                      {image.pix_w > 0 && (
                        <div
                          style={{
                            position: "absolute", bottom: 8, left: 8,
                            background: "rgba(0,0,0,.50)",
                            backdropFilter: "blur(4px)",
                            color: "#fff", fontSize: 10, fontWeight: 500,
                            padding: "2px 8px", borderRadius: 999,
                            opacity: isHovered || isSelected ? 1 : 0,
                            transition: "opacity .2s",
                          }}
                        >
                          {image.pix_w} × {image.pix_h}
                        </div>
                      )}
                    </div>

                    {/* ── Info strip ── */}
                    <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
                      <p title={image.title} style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: isSelected ? BRAND : "#1e2a3b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.35, transition: "color .15s" }}>
                        {image.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {image.file_size > 0 && (
                          <span style={{ fontSize: 10.5, color: "#a0aab8", fontWeight: 500 }}>{formatFileSize(image.file_size)}</span>
                        )}
                        {image.pix_w > 0 && (
                          <>
                            <span style={{ fontSize: 10, color: "#d1d5db" }}>·</span>
                            <span style={{ fontSize: 10.5, color: "#a0aab8" }}>{image.pix_w} × {image.pix_h} px</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer (floating island) ── */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 40px)",
          maxWidth: "1000px",
          padding: "14px 24px",
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "24px",
          zIndex: 10,
        }}>
          {/* Left: Pagination only (tabs moved to header) */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div>
              {!isLoading && totalPages > 1 && (
                <Pagination
                  current={currentPage}
                  total={imagesCount}
                  pageSize={PER_PAGE}
                  showSizeChanger={false}
                  showTotal={(total, range) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{range[0]}–{range[1]} of {total}</span>}
                  onChange={(page) => { setCurrentPage(page); setSelectedImage(null); bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                  size="small"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Selected chip */}
            {selectedImage && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 6px", background: "rgba(7,163,195,.07)", borderRadius: 10, border: "1px solid rgba(7,163,195,.22)" }}>
                <img
                  src={selectedImage.public_thumbnail_uri} alt=""
                  style={{ width: 30, height: 30, objectFit: "contain", borderRadius: 6, border: `1.5px solid ${BRAND}`, background: isTransparentFormat(selectedImage.title) ? checkerBg : plainBg }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span style={{ fontSize: 12, color: BRAND, fontWeight: 700, maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedImage.title}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              style={{ padding: "8px 22px", borderRadius: 9, border: "1.5px solid #e0e4ea", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f5f7fa")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fff")}
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!selectedImage}
              style={{
                padding: "8px 24px", borderRadius: 9, border: "none",
                fontSize: 13, fontWeight: 700, letterSpacing: .2,
                cursor: selectedImage ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all .18s ease",
                ...(selectedImage
                  ? { background: `linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%)`, color: "#fff", boxShadow: `0 4px 16px rgba(7,163,195,.35)` }
                  : { background: "#e9ecf0", color: "#b0b8c4" }),
              }}
              onMouseEnter={(e) => { if (selectedImage) (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 22px rgba(7,163,195,.46)`; }}
              onMouseLeave={(e) => { if (selectedImage) (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px rgba(7,163,195,.35)`; }}
            >
              Use This Image
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      <MultiUploadModal
        visible={uploadModalOpen}
        library={activeLibrary}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={() => {
          setUploadModalOpen(false);
          setCurrentPage(1);
          fetchImages(1, searchValue, activeLibrary);
        }}
      />
    </div>
  );
};

export default ImageGalleryModal;
