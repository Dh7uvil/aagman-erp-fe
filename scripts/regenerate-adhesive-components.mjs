import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INV = path.join(ROOT, "src/modules/inventory");

const pairs = [
  {
    srcDir: "ink-colors/components",
    dstDir: "adhesive-codes/components",
    files: [
      ["ink-hex-swatch.tsx", "adhesive-hex-swatch.tsx"],
      ["ink-color-form-fields.tsx", "adhesive-code-form-fields.tsx"],
      ["ink-color-quick-create-dialog.tsx", "adhesive-code-quick-create-dialog.tsx"],
      ["ink-colors-screen.tsx", "adhesive-codes-screen.tsx"],
      ["ink-color-record-screen.tsx", "adhesive-code-record-screen.tsx"],
    ],
    extra: transformAdhesiveCodeFile,
  },
  {
    srcDir: "inks/components",
    dstDir: "adhesives/components",
    files: [
      ["brand-quick-create-dialog.tsx", "adhesive-brand-quick-create-dialog.tsx"],
      ["ink-line-fields.tsx", "adhesive-line-fields.tsx"],
      ["ink-form-fields.tsx", "adhesive-form-fields.tsx"],
      ["ink-stock-out-schema.ts", "adhesive-stock-out-schema.ts"],
      ["ink-stock-out-fields.tsx", "adhesive-stock-out-fields.tsx"],
      ["ink-stock-out-dialog.tsx", "adhesive-stock-out-dialog.tsx"],
      ["ink-stock-out-screen.tsx", "adhesive-stock-out-screen.tsx"],
      ["inks-screen.tsx", "adhesives-screen.tsx"],
      ["ink-record-screen.tsx", "adhesive-record-screen.tsx"],
    ],
    extra: transformAdhesiveFile,
  },
  {
    srcDir: "ink-movements/components",
    dstDir: "adhesive-movements/components",
    files: [["ink-movements-screen.tsx", "adhesive-movements-screen.tsx"]],
    extra: transformAdhesiveMovementFile,
  },
];

function baseTransform(content) {
  let s = content;
  s = s.replaceAll("@/modules/inventory/ink-colors/", "@/modules/inventory/adhesive-codes/");
  s = s.replaceAll("@/modules/inventory/inks/", "@/modules/inventory/adhesives/");
  s = s.replaceAll("@/modules/inventory/ink-movements/", "@/modules/inventory/adhesive-movements/");

  s = s.replaceAll("inkColorRoutes", "adhesiveCodeRoutes");
  s = s.replaceAll("inkRoutes", "adhesiveRoutes");

  s = s.replaceAll("inkColorPermissions", "adhesiveCodePermissions");
  s = s.replaceAll("inksReportPermissions", "adhesivesReportPermissions");
  s = s.replaceAll("inkPricePermissions", "adhesivePricePermissions");
  s = s.replaceAll("inkPermissions", "adhesivePermissions");

  s = s.replaceAll("InkColor", "AdhesiveCode");
  s = s.replaceAll("inkColor", "adhesiveCode");
  s = s.replaceAll("InkColors", "AdhesiveCodes");
  s = s.replaceAll("useInkColors", "useAdhesiveCodes");
  s = s.replaceAll("useInkColor", "useAdhesiveCode");
  s = s.replaceAll("useInkColorUsage", "useAdhesiveCodeUsage");
  s = s.replaceAll("useCreateInkColor", "useCreateAdhesiveCode");
  s = s.replaceAll("useUpdateInkColor", "useUpdateAdhesiveCode");
  s = s.replaceAll("useDeleteInkColor", "useDeleteAdhesiveCode");

  s = s.replaceAll("InkHexSwatch", "AdhesiveHexSwatch");
  s = s.replaceAll("ink-hex-swatch", "adhesive-hex-swatch");

  s = s.replaceAll("InkBrand", "AdhesiveBrand");
  s = s.replaceAll("useAllInkBrands", "useAllAdhesiveBrands");
  s = s.replaceAll("useCreateInkBrand", "useCreateAdhesiveBrand");
  s = s.replaceAll("useDeleteInkSheet", "useDeleteAdhesiveSheet");
  s = s.replaceAll("useCreateInkSheet", "useCreateAdhesiveSheet");
  s = s.replaceAll("useUpdateInkSheet", "useUpdateAdhesiveSheet");
  s = s.replaceAll("useInkStockOut", "useAdhesiveStockOut");
  s = s.replaceAll("useInk", "useAdhesive");
  s = s.replaceAll("useInks", "useAdhesives");

  s = s.replaceAll("InkLine", "AdhesiveLine");
  s = s.replaceAll("InkSheet", "AdhesiveSheet");
  s = s.replaceAll("InkForm", "AdhesiveForm");
  s = s.replaceAll("inkForm", "adhesiveForm");
  s = s.replaceAll("inkSheet", "adhesiveSheet");
  s = s.replaceAll("inkLine", "adhesiveLine");
  s = s.replaceAll("emptyInkLine", "emptyAdhesiveLine");
  s = s.replaceAll("computeInkLineTotals", "computeAdhesiveLineTotals");

  s = s.replaceAll("ink_line_id", "adhesive_line_id");
  s = s.replaceAll("ink_sheet_id", "adhesive_sheet_id");
  s = s.replaceAll("color_id", "adhesive_code_id");
  s = s.replaceAll("ink_rate", "adhesive_rate");

  s = s.replaceAll("useInkDayReport", "useAdhesiveDayReport");
  s = s.replaceAll("InkDayReportRow", "AdhesiveDayReportRow");
  s = s.replaceAll("InkMovementsScreen", "AdhesiveMovementsScreen");

  s = s.replaceAll("InksScreen", "AdhesivesScreen");
  s = s.replaceAll("InkRecordScreen", "AdhesiveRecordScreen");
  s = s.replaceAll("InkRecordMode", "AdhesiveRecordMode");
  s = s.replaceAll("InkColorRecordScreen", "AdhesiveCodeRecordScreen");
  s = s.replaceAll("InkColorRecordMode", "AdhesiveCodeRecordMode");
  s = s.replaceAll("InkColorsScreen", "AdhesiveCodesScreen");
  s = s.replaceAll("InkColorFormFields", "AdhesiveCodeFormFields");
  s = s.replaceAll("InkColorQuickCreateDialog", "AdhesiveCodeQuickCreateDialog");
  s = s.replaceAll("BrandQuickCreateDialog", "AdhesiveBrandQuickCreateDialog");
  s = s.replaceAll("InkLineFields", "AdhesiveLineFields");
  s = s.replaceAll("InkFormFields", "AdhesiveFormFields");
  s = s.replaceAll("InkStockOut", "AdhesiveStockOut");
  s = s.replaceAll("buildInkStockOutFormSchema", "buildAdhesiveStockOutFormSchema");

  s = s.replaceAll("inventory.ink_colors", "inventory.adhesive_codes");
  s = s.replaceAll("inventory.ink_color_usage", "inventory.adhesive_code_usage");
  s = s.replaceAll("inventory.inks", "inventory.adhesives");
  s = s.replaceAll("inventory.inks_report", "inventory.adhesives_report");

  s = s.replaceAll('"ink-colors"', '"adhesive-codes"');
  s = s.replaceAll('"inks"', '"adhesives"');

  s = s.replaceAll("inkSheetId", "adhesiveSheetId");

  return s;
}

function transformAdhesiveCodeFile(name, content) {
  let s = baseTransform(content);
  s = s.replaceAll('sortableField: "name"', 'sortableField: "code"');
  s = s.replaceAll('{ value: "name", label: "Color" }', '{ value: "code", label: "Code" }');
  s = s.replaceAll("row.name", "row.code");
  s = s.replaceAll("deleting?.name", "deleting?.code");
  s = s.replaceAll('name="name"', 'name="code"');
  s = s.replaceAll("values.name", "values.code");
  s = s.replaceAll('name: values.name', "code: values.code");
  s = s.replaceAll('name: ""', 'code: ""');
  s = s.replaceAll("Enter color", "Enter code");
  s = s.replaceAll("Ink master", "Adhesive master");
  s = s.replaceAll("New color", "New code");
  s = s.replaceAll("Add color", "Add code");
  s = s.replaceAll("Color added to master", "Code added to master");
  s = s.replaceAll("Search color…", "Search code…");
  s = s.replaceAll("Add ink", "Add code");
  s = s.replaceAll("Ink deleted from master", "Adhesive code deleted from master");
  s = s.replaceAll("Delete ink", "Delete adhesive code");
  s = s.replaceAll("No inks in master yet.", "No adhesive codes in master yet.");
  s = s.replaceAll("Ink added to master", "Adhesive code added to master");
  s = s.replaceAll("Ink updated", "Adhesive code updated");
  s = s.replaceAll("New ink", "New adhesive code");
  s = s.replaceAll("Edit ink", "Edit adhesive code");
  s = s.replaceAll("color?.name", "code?.code");
  s = s.replaceAll("color?.name ?? \"Ink\"", "code?.code ?? \"Adhesive code\"");
  s = s.replaceAll("Ink not found.", "Adhesive code not found.");
  s = s.replaceAll("View ink and where", "View code and where");
  s = s.replaceAll("Update color or hex", "Update code or hex");
  s = s.replaceAll("Add an ink to master", "Add a code to adhesive master");
  s = s.replaceAll('historyHref("adhesive-codes", colorId, color?.name', 'historyHref("adhesive-codes", colorId, code?.code');
  s = s.replaceAll("<CardTitle className=\"text-base\">Ink</CardTitle>", '<CardTitle className="text-base">Adhesive code</CardTitle>');
  s = s.replaceAll("Ink rate", "Adhesive rate");
  s = s.replaceAll("Ink sheet", "Adhesive sheet");
  s = s.replaceAll("This ink is not on any sheet yet.", "This code is not on any sheet yet.");
  s = s.replaceAll("colorId", "codeId");
  s = s.replaceAll("const colorQuery", "const codeQuery");
  s = s.replaceAll("const color = colorQuery", "const code = codeQuery");
  s = s.replaceAll("colorQuery.", "codeQuery.");
  s = s.replaceAll("color ? adhesiveCodeToFormValues(color)", "code ? adhesiveCodeToFormValues(code)");
  s = s.replaceAll("Boolean(color)", "Boolean(code)");
  s = s.replaceAll("!color", "!code");
  s = s.replaceAll("colorId ??", "codeId ??");
  s = s.replaceAll("colorId)", "codeId)");
  s = s.replaceAll("colorId,", "codeId,");
  s = s.replaceAll("colorId ?", "codeId ?");
  s = s.replaceAll("colorId &&", "codeId &&");
  s = s.replaceAll("if (!colorId)", "if (!codeId)");
  s = s.replaceAll("id: colorId", "id: codeId");
  s = s.replaceAll("adhesiveCodeRoutes.view(colorId)", "adhesiveCodeRoutes.view(codeId)");
  s = s.replaceAll("row.color_name", "row.code");
  s = s.replaceAll(".label: c.name", ".label: c.code");
  s = s.replaceAll("options={colors.map((c) => ({ value: c.id, label: c.name }))}", "options={codes.map((c) => ({ value: c.id, label: c.code }))}");
  s = s.replaceAll("useAllInkColors", "useAllAdhesiveCodes");
  s = s.replaceAll("ink-color-quick-create", "adhesive-code-quick-create");
  if (name.includes("record-screen")) {
    s = s.replace(/\{\s*mode,\s*colorId,\s*\}/, "{ mode, codeId, }");
    s = s.replace(/colorId\?: string;/, "codeId?: string;");
  }
  return s;
}

function stripDocumentsSection(content) {
  const start = content.indexOf('        <div className="flex flex-col gap-3 border-t border-border pt-5">');
  if (start === -1) return content;
  const end = content.indexOf("      </InkFormSection>", start);
  if (end === -1) return content;
  return content.slice(0, start) + content.slice(end);
}

function transformAdhesiveFile(name, content) {
  let s = baseTransform(content);
  if (name.includes("form-fields")) {
    s = s.replace(/import \{[\s\S]*?InkFileSlotsPlaceholder,[\s\S]*?\} from "@\/modules\/inventory\/adhesives\/components\/[^"]+";?\n/, "");
    s = stripDocumentsSection(s);
    s = s.replaceAll("InkFormSection", "AdhesiveFormSection");
    s = s.replaceAll("Ink lines", "Adhesive lines");
    s = s.replaceAll("isCreate,\n  sheet,", "isCreate,");
    s = s.replaceAll("  isCreate: boolean;\n  sheet: AdhesiveSheet | null | undefined;", "  isCreate: boolean;");
    s = s.replace(/,\s*sheet,\s*\n\}\)/, ", isCreate,");
    s = s.replace(/sheet={mode === "create" \? null : sheet}\n\s*\/>/, "/>");
  }
  s = s.replaceAll("row.color_name", "row.code");
  s = s.replaceAll("line.color_name", "line.code");
  s = s.replaceAll("c.name", "c.code");
  s = s.replaceAll("colors.map((c) => ({ value: c.id, label: c.name }))", "codes.map((c) => ({ value: c.id, label: c.code }))");
  s = s.replaceAll("const colorsQuery", "const codesQuery");
  s = s.replaceAll("const colors = colorsQuery", "const codes = codesQuery");
  s = s.replaceAll("colorsQuery.", "codesQuery.");
  s = s.replaceAll("colors.map", "codes.map");
  s = s.replaceAll("colorById", "codeById");
  s = s.replaceAll("syncHexForLine(index, colorId", "syncHexForLine(index, adhesiveCodeId");
  s = s.replaceAll("canCreateColor", "canCreateCode");
  s = s.replaceAll("colorDialog", "codeDialog");
  s = s.replaceAll("setColorDialog", "setCodeDialog");
  s = s.replaceAll("colorDialogIndex", "codeDialogIndex");
  s = s.replaceAll("AdhesiveCodeQuickCreateDialog", "AdhesiveCodeQuickCreateDialog");
  s = s.replaceAll("canCreateInk", "canCreateAdhesive");
  s = s.replaceAll("INK_LINE_", "ADHESIVE_LINE_");
  s = s.replaceAll("inkLineGridClass", "adhesiveLineGridClass");
  s = s.replaceAll("inkLineTableMinWidth", "adhesiveLineTableMinWidth");
  s = s.replaceAll("Ink rate", "Adhesive rate");
  s = s.replaceAll("Inks", "Adhesives");
  s = s.replaceAll("Ink ", "Adhesive ");
  s = s.replaceAll("ink ", "adhesive ");
  s = s.replaceAll("Company ink inventory", "Company adhesive inventory");
  s = s.replaceAll("Add ink sheet", "Add adhesive sheet");
  s = s.replaceAll("No ink lines yet.", "No adhesive lines yet.");
  s = s.replaceAll("Search company, brand, or color…", "Search company, brand, or code…");
  s = s.replaceAll("Ink sheet deleted", "Adhesive sheet deleted");
  s = s.replaceAll("Delete ink sheet", "Delete adhesive sheet");
  s = s.replaceAll("Ink sheet created", "Adhesive sheet created");
  s = s.replaceAll("Ink sheet updated", "Adhesive sheet updated");
  s = s.replaceAll("Ink sheet not found.", "Adhesive sheet not found.");
  s = s.replaceAll("New ink sheet", "New adhesive sheet");
  s = s.replaceAll("Edit ink sheet", "Edit adhesive sheet");
  s = s.replaceAll("Ink sheet", "Adhesive sheet");
  s = s.replaceAll("optional product and ink images", "adhesive lines for a company");
  s = s.replaceAll("Update ink lines for this company", "Update adhesive lines for this company");
  s = s.replaceAll("Company ink inventory and line items", "Company adhesive inventory and line items");
  s = s.replaceAll("Create ink sheet", "Create adhesive sheet");
  s = s.replaceAll("Ink stock out", "Adhesive stock out");
  s = s.replaceAll("Remove drums or quantity from an ink line.", "Remove drums or quantity from an adhesive line.");
  s = s.replaceAll("Select ink sheet", "Select adhesive sheet");
  s = s.replaceAll("Ink sheet", "Adhesive sheet");
  s = s.replaceAll("This sheet has no ink lines.", "This sheet has no adhesive lines.");
  s = s.replaceAll("Add ink lines before recording stock out.", "Add adhesive lines before recording stock out.");
  s = s.replaceAll("Ink line", "Adhesive line");
  s = s.replaceAll("Select an ink line", "Select an adhesive line");
  s = s.replaceAll("New ink brand", "New adhesive brand");
  s = s.replaceAll("ink-brand-quick-create", "adhesive-brand-quick-create");
  s = s.replaceAll('header: "Color"', 'header: "Code"');
  s = s.replaceAll(">Color<", ">Code<");
  s = s.replaceAll('placeholder="Color"', 'placeholder="Code"');
  s = s.replaceAll("New color", "New code");
  s = s.replaceAll("canCreateColor", "canCreateCode");
  s = s.replaceAll("useAllAdhesiveCodes", "useAllAdhesiveCodes");
  s = s.replaceAll("inkColorPermissions", "adhesiveCodePermissions");
  s = s.replaceAll('searchParams.get("ink_sheet_id")', 'searchParams.get("adhesive_sheet_id")');
  s = s.replaceAll('searchParams.get("ink_line_id")', 'searchParams.get("adhesive_line_id")');
  return s;
}

function transformAdhesiveMovementFile(name, content) {
  let s = baseTransform(content);
  s = s.replaceAll("Inks report", "Adhesives report");
  s = s.replaceAll("every active ink line.", "every active adhesive line.");
  s = s.replaceAll("No ink movements for this date.", "No adhesive movements for this date.");
  s = s.replaceAll("row.color_name", "row.code");
  s = s.replaceAll('header: "Color"', 'header: "Code"');
  s = s.replaceAll("ink-report-date", "adhesive-report-date");
  s = s.replaceAll("Ink rate", "Adhesive rate");
  return s;
}

for (const { srcDir, dstDir, files, extra } of pairs) {
  const dstPath = path.join(INV, dstDir);
  fs.mkdirSync(dstPath, { recursive: true });
  for (const [srcFile, dstFile] of files) {
    const src = path.join(INV, srcDir, srcFile);
    let content = fs.readFileSync(src, "utf8");
    content = extra(dstFile, content);
    fs.writeFileSync(path.join(dstPath, dstFile), content);
    console.log("wrote", path.join(dstDir, dstFile));
  }
}

// Remove stale ink-named files in adhesive component dirs
const stale = [
  ...fs.readdirSync(path.join(INV, "adhesive-codes/components")).filter((f) => f.startsWith("ink-")),
  ...fs.readdirSync(path.join(INV, "adhesives/components")).filter((f) => f.startsWith("ink-") || f === "inks-screen.tsx" || f === "brand-quick-create-dialog.tsx"),
  ...fs.readdirSync(path.join(INV, "adhesive-movements/components")).filter((f) => f.startsWith("ink-")),
];
for (const f of stale) {
  const full = f.includes("/") ? f : null;
}
for (const dir of ["adhesive-codes/components", "adhesives/components", "adhesive-movements/components"]) {
  const fullDir = path.join(INV, dir);
  for (const f of fs.readdirSync(fullDir)) {
    const isStale =
      f.startsWith("ink-") ||
      f === "inks-screen.tsx" ||
      f === "brand-quick-create-dialog.tsx";
    const keep = new Set(pairs.flatMap((p) => (p.dstDir === dir ? p.files.map(([, d]) => d) : [])));
    if (isStale && !keep.has(f)) {
      fs.unlinkSync(path.join(fullDir, f));
      console.log("removed stale", path.join(dir, f));
    }
  }
}
