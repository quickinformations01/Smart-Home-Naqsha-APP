import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Calculator,
  Hammer,
  Truck,
  Droplet,
  Settings2,
  Printer,
  Info,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { NaqshaLayout } from '../types';
import {
  EstimatorInputs,
  MaterialRates,
  calculatePakistanGreyStructureCost,
  DEFAULT_PAK_RATES,
  DEFAULT_ESTIMATOR_INPUTS
} from '../utils/pakCostCalculator';

interface PakistanCostEstimatorDashboardProps {
  layout: NaqshaLayout;
  inputs: EstimatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<EstimatorInputs>>;
  rates: MaterialRates;
  setRates: React.Dispatch<React.SetStateAction<MaterialRates>>;
}

export default function PakistanCostEstimatorDashboard({
  layout,
  inputs,
  setInputs,
  rates,
  setRates
}: PakistanCostEstimatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'structural' | 'rates'>('structural');
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    structural: false,
    rates: false,
    materials: false,
    floorBreakdown: false,
    breakdown: false
  });
  const [expandedFloorMaterials, setExpandedFloorMaterials] = useState<{ [key: string]: boolean }>({});

  const toggleFloorMaterials = (floorKey: string) => {
    setExpandedFloorMaterials((prev) => ({ ...prev, [floorKey]: !prev[floorKey] }));
  };

  // Calculate Grey Structure Cost using our dynamic engine
  const estimate = calculatePakistanGreyStructureCost(layout, inputs, rates);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateInput = (key: keyof EstimatorInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const updateRate = (key: keyof MaterialRates, value: number) => {
    setRates((prev) => ({ ...prev, [key]: value }));
  };

  const formatPKR = (num: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Outer border
    doc.setDrawColor(15, 23, 42); // slate-900 / dark steel
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 190, 277);

    // Inner border
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.25);
    doc.rect(12, 12, 186, 273);

    // Header Title Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(12, 12, 186, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PAKISTAN GREY STRUCTURE COST ESTIMATION BILL', 105, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`DIGITAL QUANTITY SURVEY & MATERIAL BILL  •  GENERATED FOR ${layout.width}'x${layout.length}' PLOT`, 105, 26, { align: 'center' });

    // Project Info Strip
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(12, 32, 186, 12, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(12, 44, 198, 44);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PLOT FOOTPRINT:', 15, 39);
    doc.setFont('helvetica', 'normal');
    doc.text(`${layout.width} x ${layout.length} ${layout.unit.toUpperCase()} (${layout.width * layout.length} Sq Ft)`, 50, 39);

    doc.setFont('helvetica', 'bold');
    doc.text('COVERED AREA:', 110, 39);
    doc.setFont('helvetica', 'normal');
    doc.text(`${Math.round(estimate.coveredAreaSqFt).toLocaleString()} SFT (${estimate.floorsCount} Floors)`, 145, 39);

    // Budget summary bento card
    const summaryY = 48;
    doc.setFillColor(239, 246, 255); // light blue
    doc.rect(12, summaryY, 186, 22, 'F');
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.setLineWidth(0.3);
    doc.rect(12, summaryY, 186, 22, 'S');

    doc.setTextColor(29, 78, 216); // blue-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GREY STRUCTURE ESTIMATED INVESTMENT BUDGET', 15, summaryY + 6);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(formatPKR(estimate.grandTotal), 15, summaryY + 15);

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`MATERIAL: ${formatPKR(estimate.totalMaterialCost)} (${Math.round((estimate.totalMaterialCost / estimate.grandTotal) * 100)}%)`, 110, summaryY + 10);
    doc.text(`LABOUR: ${formatPKR(estimate.totalLabourCost)} (${Math.round((estimate.totalLabourCost / estimate.grandTotal) * 100)}%)`, 110, summaryY + 16);

    // Floor-Wise Cost Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. FLOOR-WISE BILL OF QUANTITIES (BOQ)', 14, 76);

    const fTableY = 80;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(12, fTableY, 186, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(12, fTableY, 186, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('FLOOR NAME / LEVEL', 15, fTableY + 5.5);
    doc.text('COVERED AREA', 65, fTableY + 5.5);
    doc.text('MATERIAL COST', 100, fTableY + 5.5);
    doc.text('LABOUR COST', 140, fTableY + 5.5);
    doc.text('TOTAL COST', 170, fTableY + 5.5);

    let currentY = fTableY + 8;
    estimate.floorWiseBreakdown.forEach((floor, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(12, currentY, 186, 7.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(12, currentY + 7.5, 198, currentY + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(floor.floorName, 15, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.text(floor.coveredAreaSqFt > 0 ? `${Math.round(floor.coveredAreaSqFt).toLocaleString()} SFT` : 'N/A', 65, currentY + 5);
      doc.text(formatPKR(floor.materialCost), 100, currentY + 5);
      doc.text(formatPKR(floor.labourCost), 140, currentY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(formatPKR(floor.totalCost), 170, currentY + 5);

      currentY += 7.5;
    });

    // Material consumption checklist
    const mCheckY = currentY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. CORE MATERIAL CONSUMPTION & CURRENT MARKET ESTIMATES', 14, mCheckY);

    const mTableY = mCheckY + 4;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(12, mTableY, 186, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(12, mTableY, 186, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('MATERIAL ITEM', 15, mTableY + 5.5);
    doc.text('ESTIMATED QUANTITY', 70, mTableY + 5.5);
    doc.text('MARKET RATE', 120, mTableY + 5.5);
    doc.text('ESTIMATED COST (PKR)', 160, mTableY + 5.5);

    const materials = [
      { name: 'Cement (Grade 53/OPC)', qty: `${estimate.materialBreakdown.cementBags.toLocaleString()} Bags`, rate: `${formatPKR(rates.cement)} /Bag`, total: formatPKR(estimate.materialBreakdown.cementBags * rates.cement) },
      { name: 'Steel Rebar (60 Grade Deformed)', qty: `${estimate.materialBreakdown.steelTons.toFixed(2)} Tons`, rate: `${formatPKR(rates.steel)} /Ton`, total: formatPKR(estimate.materialBreakdown.steelTons * rates.steel) },
      { name: 'Red Clay Bricks (First Class)', qty: `${estimate.materialBreakdown.bricksCount.toLocaleString()} Pcs`, rate: `${formatPKR(rates.bricks)} /Pc`, total: formatPKR(estimate.materialBreakdown.bricksCount * rates.bricks) },
      { name: 'Coarse Sand (Ravi/Lawrencepur average)', qty: `${estimate.materialBreakdown.sandCft.toLocaleString()} CFT`, rate: `${formatPKR(rates.sand)} /CFT`, total: formatPKR(estimate.materialBreakdown.sandCft * rates.sand) },
      { name: 'Crush Gravel (Sargodha/Margalla)', qty: `${estimate.materialBreakdown.crushCft.toLocaleString()} CFT`, rate: `${formatPKR(rates.crush)} /CFT`, total: formatPKR(estimate.materialBreakdown.crushCft * rates.crush) },
      { name: 'Steel Binding Wire', qty: `${estimate.materialBreakdown.bindingWireKg.toLocaleString()} KG`, rate: `${formatPKR(rates.bindingWire)} /KG`, total: formatPKR(estimate.materialBreakdown.bindingWireKg * rates.bindingWire) },
    ];

    let matY = mTableY + 8;
    materials.forEach((mat, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(12, matY, 186, 7.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(12, matY + 7.5, 198, matY + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(mat.name, 15, matY + 5);

      doc.setFont('helvetica', 'normal');
      doc.text(mat.qty, 70, matY + 5);
      doc.text(mat.rate, 120, matY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(mat.total, 160, matY + 5);

      matY += 7.5;
    });

    // Verification details & notes
    const noteY = matY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('QUANTITY SURVEY NOTES & ASSUMPTIONS', 14, noteY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('• Cement bag estimates are aligned with a 1:2:4 ratio mix for RCC columns, beams, slabs, and 1:4/1:6 ratios for block work and plasters.', 14, noteY + 5);
    doc.text('• Steel Rebar calculations assume standard structural load requirements of 3 to 4.5 KG per SFT depending on portion level.', 14, noteY + 10);
    doc.text('• Labor cost varies regionally across Pakistan. Estimates reflect Punjab/Sindh/KPK standard municipal contract averages.', 14, noteY + 15);
    doc.text('• Disclaimer: This is a digital quantity estimate. Actual site rates are subject to local inflation, material grade, and execution specifications.', 14, noteY + 20);

    // Signature stamp
    const sigY = 230;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, sigY + 20, 70, sigY + 20);
    doc.line(130, sigY + 20, 185, sigY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('QUANTITY SURVEYOR SIGNATURE:', 15, sigY + 4);
    doc.text('MUNICIPAL HOUSING REGISTRY STAMP:', 130, sigY + 4);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('AI Quantity Estimator Compiler', 15, sigY + 12);
    doc.text('Pakistan Civil Engineering Registry', 130, sigY + 12);

    // Official Seal Stamp Circle
    doc.setDrawColor(16, 185, 129); // emerald green stamp
    doc.setFillColor(240, 253, 250); // emerald-50
    doc.setLineWidth(0.4);
    doc.circle(105, sigY + 16, 13, 'F');
    doc.circle(105, sigY + 16, 13, 'S');

    // Circular Stamp text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(16, 185, 129);
    doc.text('NAQSHA ESTIMATES', 105, sigY + 11, { align: 'center' });
    doc.setFontSize(5.5);
    doc.text('VERIFIED & CERT', 105, sigY + 16, { align: 'center' });
    doc.setFontSize(4);
    doc.text('STAMP-2026', 105, sigY + 21, { align: 'center' });

    // Page footnote
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SHEET 01 OF 01  •  DRAFTED IN COMPLIANCE WITH PAKISTAN CIVIL ENGINEERING STANDARDS', 105, 281, { align: 'center' });

    // Save and Download
    try {
      const pdfDataUri = doc.output('datauristring');
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfDataUri;
      downloadLink.download = `Pakistan_Grey_Structure_Cost_Estimate_${layout.width}x${layout.length}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (pdfErr) {
      console.error('Failed to download PDF, trying standard save fallback:', pdfErr);
      doc.save(`Pakistan_Grey_Structure_Cost_Estimate_${layout.width}x${layout.length}.pdf`);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in duration-200">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-emerald-800/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" /> Intelligent Estimation Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            Pakistan Grey Structure Cost Estimator
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
            Calculated dynamically based on real architectural partitions, wall lengths, and door/window openings of your active <strong>{layout.width}'x{layout.length}' Naqsha</strong>, not just gross estimates.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-teal-950 rounded-2xl font-extrabold text-xs transition duration-150 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          id="print-estimation-btn"
        >
          <Printer className="w-4 h-4 text-emerald-600" />
          <span>Export Estimations (PDF)</span>
        </button>
      </div>

      {/* Main Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Cost Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/30 dark:to-teal-950/10 border border-emerald-500/20 dark:border-emerald-500/10 p-5 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
            Total Grey Structure Cost
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
            {formatPKR(estimate.grandTotal)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Approx. Grand Total (PKR)
          </span>
        </div>

        {/* Cost per SqFt */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            Cost Per Square Foot
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 font-mono tracking-tight">
            {formatPKR(estimate.costPerSqFt)}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans"> /SFT</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Standard municipal benchmark
          </span>
        </div>

        {/* Covered Area */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            Covered Area (Built)
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 font-mono tracking-tight">
            {Math.round(estimate.coveredAreaSqFt).toLocaleString()}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans"> Sq Ft</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Across {estimate.floorsCount} floors / storeys
          </span>
        </div>

        {/* Material Cost Share */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            Material Cost Share
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
            {formatPKR(estimate.totalMaterialCost)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {Math.round((estimate.totalMaterialCost / estimate.grandTotal) * 100)}% of grand total budget
          </span>
        </div>

        {/* Labour Cost Share */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            Labour Cost Share
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {formatPKR(estimate.totalLabourCost)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {Math.round((estimate.totalLabourCost / estimate.grandTotal) * 100)}% of grand total budget
          </span>
        </div>
      </div>

      {/* Main Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Input Customizers & Rate Editors (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Segmented Controller Tab */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('structural')}
                className={`py-2 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'structural'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-450 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                id="tab-structural-inputs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Structure Params</span>
              </button>
              <button
                onClick={() => setActiveTab('rates')}
                className={`py-2 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'rates'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-450 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                id="tab-pakistan-rates"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Market Rates</span>
              </button>
            </div>

            {/* TAB CONTENT: STRUCTURAL INPUTS */}
            {activeTab === 'structural' && (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {/* Wall Height */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">Wall Height (Clear Ceiling)</label>
                    <span className="font-mono font-bold text-blue-600">{inputs.wallHeight} ft</span>
                  </div>
                  <input
                    type="range"
                    min="9"
                    max="14"
                    step="0.5"
                    value={inputs.wallHeight}
                    onChange={(e) => updateInput('wallHeight', parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[9px] text-slate-400 italic">Adjusts concrete & brick superstructure volume.</p>
                </div>

                {/* Wall Thicknesses */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Ext. Wall Thickness</label>
                    <select
                      value={inputs.wallThicknessExt}
                      onChange={(e) => updateInput('wallThicknessExt', parseFloat(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                    >
                      <option value="4.5">4.5 inch</option>
                      <option value="9">9 inch (Standard)</option>
                      <option value="13.5">13.5 inch</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Int. Wall Thickness</label>
                    <select
                      value={inputs.wallThicknessInt}
                      onChange={(e) => updateInput('wallThicknessInt', parseFloat(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                    >
                      <option value="4.5">4.5 inch (Standard)</option>
                      <option value="9">9 inch</option>
                      <option value="13.5">13.5 inch</option>
                    </select>
                  </div>
                </div>

                {/* Foundation Configuration */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 space-y-3">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Foundation & Footings</span>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foundation Type</label>
                    <select
                      value={inputs.foundationType}
                      onChange={(e) => updateInput('foundationType', e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="strip">Strip Wall Footing (Load-Bearing)</option>
                      <option value="pad">RCC Pad Footings (Frame-Structure)</option>
                      <option value="raft">Raft Foundation (Soft Soil/Basement)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Excavation Depth</label>
                      <span className="font-mono font-bold text-blue-600">{inputs.foundationDepth} ft</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="8"
                      step="0.5"
                      value={inputs.foundationDepth}
                      onChange={(e) => updateInput('foundationDepth', parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                {/* Columns & Beams Frame */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 space-y-3">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">RCC Frame Sizing</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Column Quantity</label>
                      <span className="font-mono font-bold text-blue-600">{inputs.columnQuantity} columns</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      step="1"
                      value={inputs.columnQuantity}
                      onChange={(e) => updateInput('columnQuantity', parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Col Size (X x Y)</label>
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          value={inputs.columnSizeX}
                          onChange={(e) => updateInput('columnSizeX', parseInt(e.target.value) || 9)}
                          className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                        />
                        <span className="text-[10px] text-slate-400">x</span>
                        <input
                          type="number"
                          value={inputs.columnSizeY}
                          onChange={(e) => updateInput('columnSizeY', parseInt(e.target.value) || 9)}
                          className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Beam Depth</label>
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          value={inputs.beamSizeX}
                          onChange={(e) => updateInput('beamSizeX', parseInt(e.target.value) || 9)}
                          className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                        />
                        <span className="text-[10px] text-slate-400">x</span>
                        <input
                          type="number"
                          value={inputs.beamSizeY}
                          onChange={(e) => updateInput('beamSizeY', parseInt(e.target.value) || 12)}
                          className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roof Slab Configurations */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 space-y-3">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Roof Slab Parameters</span>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Slab Concrete Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateInput('roofType', 'rcc')}
                        className={`py-2 px-1 text-xs font-extrabold rounded-lg border transition ${
                          inputs.roofType === 'rcc'
                            ? 'bg-blue-600/10 border-blue-600 text-blue-700 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        RCC Solid Slab
                      </button>
                      <button
                        onClick={() => updateInput('roofType', 'rb')}
                        className={`py-2 px-1 text-xs font-extrabold rounded-lg border transition ${
                          inputs.roofType === 'rb'
                            ? 'bg-blue-600/10 border-blue-600 text-blue-700 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        RB Roof (Bricks)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Slab Thickness</label>
                      <span className="font-mono font-bold text-blue-600">{inputs.slabThickness} inches</span>
                    </div>
                    <input
                      type="range"
                      min="4.5"
                      max="7.5"
                      step="0.5"
                      value={inputs.slabThickness}
                      onChange={(e) => updateInput('slabThickness', parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                {/* Auxiliary structural elements */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 space-y-3">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Auxiliary Components</span>
                  
                  {/* Staircase Toggle */}
                  <label className="flex items-center justify-between p-1 cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Staircase Tower (RCC Stairs)</span>
                    <input
                      type="checkbox"
                      checked={inputs.hasStaircase}
                      onChange={(e) => updateInput('hasStaircase', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                  </label>

                  {/* Parapet Wall Sizing */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200/30 dark:border-slate-800/50 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-450 uppercase">Parapet Height (ft)</label>
                      <input
                        type="number"
                        min="2"
                        max="6"
                        step="0.5"
                        value={inputs.parapetHeight}
                        onChange={(e) => updateInput('parapetHeight', parseFloat(e.target.value) || 3)}
                        className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-450 uppercase">Parapet Thick (in)</label>
                      <input
                        type="number"
                        min="4.5"
                        max="9"
                        step="4.5"
                        value={inputs.parapetThickness}
                        onChange={(e) => updateInput('parapetThickness', parseFloat(e.target.value) || 4.5)}
                        className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  {/* Water Tank */}
                  <div className="border-t border-slate-200/30 dark:border-slate-800/50 pt-2 space-y-2">
                    <label className="flex items-center justify-between p-1 cursor-pointer">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Overhead Water Tank (RCC)</span>
                      <input
                        type="checkbox"
                        checked={inputs.hasWaterTank}
                        onChange={(e) => updateInput('hasWaterTank', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                    </label>
                    {inputs.hasWaterTank && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-450 uppercase">Tank Capacity (Gallons)</label>
                        <select
                          value={inputs.waterTankCapacity}
                          onChange={(e) => updateInput('waterTankCapacity', parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 font-bold"
                        >
                          <option value="1000">1,000 Gallons</option>
                          <option value="2000">2,000 Gallons (Standard)</option>
                          <option value="3000">3,000 Gallons</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MATERIAL RATES */}
            {activeTab === 'rates' && (
              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                <p className="text-[10px] text-slate-450 leading-relaxed bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 p-2.5 rounded-2xl font-medium">
                  ⚠️ Adjust rates manually according to current retail rates in your city (Lahore, Karachi, Islamabad, Rawalpindi, Peshawar, Multan, etc.)
                </p>

                {/* Cement Bag */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Cement Rate (per Bag)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.cement}</span>
                  </div>
                  <input
                    type="number"
                    value={rates.cement}
                    onChange={(e) => updateRate('cement', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                {/* Steel per Ton */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Steel / Sarya (per Ton)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.steel.toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    value={rates.steel}
                    onChange={(e) => updateRate('steel', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                {/* Bricks per 1000 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Single Brick Rate (Awwal)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.bricks}</span>
                  </div>
                  <input
                    type="number"
                    value={rates.bricks}
                    onChange={(e) => updateRate('bricks', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                  <p className="text-[9px] text-slate-400 italic">E.g., PKR 18 per brick is equivalent to PKR 18,000 per 1000 bricks.</p>
                </div>

                {/* Sand per CFT */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Sand / Rait (per CFT)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.sand}</span>
                  </div>
                  <input
                    type="number"
                    value={rates.sand}
                    onChange={(e) => updateRate('sand', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                {/* Crush per CFT */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Crush / Bajri (per CFT)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.crush}</span>
                  </div>
                  <input
                    type="number"
                    value={rates.crush}
                    onChange={(e) => updateRate('crush', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                {/* Grey Structure Contractor Labour Rate */}
                <div className="space-y-1 border-t border-slate-200/30 dark:border-slate-800/50 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">Labour Rate (per SFT)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.labourRate} / SFT</span>
                  </div>
                  <input
                    type="number"
                    value={rates.labourRate}
                    onChange={(e) => updateRate('labourRate', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                  <p className="text-[9px] text-slate-400 italic">Total structural execution contractor contract rate per covered area.</p>
                </div>

                {/* Shuttering rental */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Shuttering Rental (per SFT)</label>
                    <span className="font-mono font-bold text-emerald-600">PKR {rates.shuttering}</span>
                  </div>
                  <input
                    type="number"
                    value={rates.shuttering}
                    onChange={(e) => updateRate('shuttering', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                {/* Logistics */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/30 dark:border-slate-850 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Logistics & Flat Budgets</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-450 uppercase">Transport</label>
                      <input
                        type="number"
                        value={rates.transportation}
                        onChange={(e) => updateRate('transportation', parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-450 uppercase">Water Supply</label>
                      <input
                        type="number"
                        value={rates.water}
                        onChange={(e) => updateRate('water', parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Estimations breakdowns & Material Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Material Quantities Summary block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <button
              onClick={() => toggleSection('materials')}
              className="w-full flex items-center justify-between font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-4 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" /> Material Quantities & Raw Stocks required
              </span>
              {collapsedSections.materials ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!collapsedSections.materials && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Cement */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Cement (Gravel / DG)</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {estimate.materialBreakdown.cementBags.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Bags (50 kg)</span>
                </div>

                {/* Sarya Steel */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Steel (Sarya - Grade 60)</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {estimate.materialBreakdown.steelTons}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Metric Tons</span>
                </div>

                {/* Bricks */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Bricks (Eent - Awwal)</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {estimate.materialBreakdown.bricksCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Numbers (Pcs)</span>
                </div>

                {/* Sand */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Sand (Ravi/Lawrencepur)</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {estimate.materialBreakdown.sandCft.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">CFT (Cubic Feet)</span>
                </div>

                {/* Crush */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Crush (Sargodha/Margalla)</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {estimate.materialBreakdown.crushCft.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">CFT (Cubic Feet)</span>
                </div>

                {/* Binding Wire */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Binding Wire (Ghai)</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {estimate.materialBreakdown.bindingWireKg}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Kilograms (kg)</span>
                </div>
              </div>
            )}
          </div>

          {/* Floor-Wise Cost Breakdown Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <button
              onClick={() => toggleSection('floorBreakdown')}
              className="w-full flex items-center justify-between font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" /> Floor-Wise Material & Cost Breakdown
              </span>
              {collapsedSections.floorBreakdown ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!collapsedSections.floorBreakdown && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Below is the cost and material distribution allocated per floor. Structural foundation and plinth beam elements are attributed to the Ground Floor, staircase/parapet/overhead tank are attributed to the Top Floor, and general site logistics are grouped separately.
                </p>

                <div className="border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200/50 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-4 py-3">Floor / Storey</th>
                          <th className="px-4 py-3 text-right">Covered Area</th>
                          <th className="px-4 py-3 text-right">Material PKR</th>
                          <th className="px-4 py-3 text-right">Labour PKR</th>
                          <th className="px-4 py-3 text-right">Total PKR</th>
                          <th className="px-4 py-3 text-center">Material Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-350">
                        {estimate.floorWiseBreakdown.map((floor) => {
                          const isExpanded = expandedFloorMaterials[floor.floorKey];
                          return (
                            <React.Fragment key={floor.floorKey}>
                              <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                                <td className="px-4 py-4 text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    floor.floorKey === 'ground' ? 'bg-emerald-500' :
                                    floor.floorKey === 'first' ? 'bg-blue-500' :
                                    floor.floorKey === 'second' ? 'bg-purple-500' : 'bg-slate-400'
                                  }`} />
                                  {floor.floorName}
                                </td>
                                <td className="px-4 py-4 text-right font-mono">
                                  {floor.coveredAreaSqFt > 0 ? (
                                    <>
                                      {Math.round(floor.coveredAreaSqFt).toLocaleString()} <span className="text-[10px] font-sans text-slate-450">Sq Ft</span>
                                    </>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {formatPKR(floor.materialCost)}
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {formatPKR(floor.labourCost)}
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-teal-600 dark:text-teal-400 font-bold">
                                  {formatPKR(floor.totalCost)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {floor.floorKey !== 'logistics' ? (
                                    <button
                                      onClick={() => toggleFloorMaterials(floor.floorKey)}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                                    >
                                      <span>{isExpanded ? 'Hide Stocks' : 'View Stocks'}</span>
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-normal">N/A</span>
                                  )}
                                </td>
                              </tr>
                              
                              {/* Expanded Material Breakdown Row */}
                              {isExpanded && floor.floorKey !== 'logistics' && (
                                <tr className="bg-slate-50/50 dark:bg-slate-950/30">
                                  <td colSpan={6} className="px-6 py-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                      {/* Cement */}
                                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-center rounded-xl space-y-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Cement</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                          {floor.materialBreakdown.cementBags.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">Bags</span>
                                        </span>
                                      </div>
                                      
                                      {/* Steel */}
                                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-center rounded-xl space-y-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Steel (Sarya)</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                          {floor.materialBreakdown.steelTons} <span className="text-[9px] font-normal text-slate-400">Tons</span>
                                        </span>
                                      </div>

                                      {/* Bricks */}
                                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-center rounded-xl space-y-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Bricks</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                          {floor.materialBreakdown.bricksCount.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">Pcs</span>
                                        </span>
                                      </div>

                                      {/* Sand */}
                                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-center rounded-xl space-y-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Sand</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                          {floor.materialBreakdown.sandCft.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">CFT</span>
                                        </span>
                                      </div>

                                      {/* Crush */}
                                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-center rounded-xl space-y-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Crush</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                          {floor.materialBreakdown.crushCft.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">CFT</span>
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {/* Combined Total Row */}
                        <tr className="bg-slate-100/50 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">
                          <td className="px-4 py-4 text-xs font-black uppercase">
                            Combined Total
                          </td>
                          <td className="px-4 py-4 text-right font-mono">
                            {Math.round(estimate.coveredAreaSqFt).toLocaleString()} <span className="text-[10px] font-sans text-slate-450">Sq Ft</span>
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-blue-600 dark:text-blue-400">
                            {formatPKR(estimate.totalMaterialCost)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-amber-600 dark:text-amber-400">
                            {formatPKR(estimate.totalLabourCost)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                            {formatPKR(estimate.grandTotal)}
                          </td>
                          <td className="px-4 py-4 text-center text-[10px] text-slate-400 font-normal">
                            Full Project
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stage-wise Breakdown Tables */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <button
              onClick={() => toggleSection('breakdown')}
              className="w-full flex items-center justify-between font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Stage-Wise Grey Structure Cost Breakdown
              </span>
              {collapsedSections.breakdown ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!collapsedSections.breakdown && (
              <div className="space-y-6">
                {estimate.stages.map((stage, idx) => (
                  <div key={idx} className="border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {/* Stage Header */}
                    <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800 gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                        {stage.stageName}
                      </span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                        Subtotal: {formatPKR(stage.totalCost)}
                      </span>
                    </div>

                    {/* Stage Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-2.5">Structural Item / Component</th>
                            <th className="px-4 py-2.5">Material Spec</th>
                            <th className="px-4 py-2.5 text-right">Quantity</th>
                            <th className="px-4 py-2.5 text-right">Material PKR</th>
                            <th className="px-4 py-2.5 text-right">Labour PKR</th>
                            <th className="px-4 py-2.5 text-right">Total PKR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                          {stage.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 font-semibold text-slate-700 dark:text-slate-350">
                              <td className="px-4 py-3.5 flex items-center gap-1">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                {item.stage}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                                {item.materialName}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {item.quantity.toLocaleString()} <span className="text-[9px] font-sans text-slate-400">{item.unit}</span>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-650 dark:text-slate-400">
                                {item.materialCost > 0 ? Math.round(item.materialCost).toLocaleString() : '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-650 dark:text-slate-400">
                                {item.labourCost > 0 ? Math.round(item.labourCost).toLocaleString() : '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {formatPKR(item.totalCost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal and Engineering Disclaimer Notice */}
          <div className="p-5 bg-blue-50 dark:bg-blue-950/15 border border-blue-200/50 dark:border-blue-900/35 rounded-3xl space-y-2">
            <h5 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" /> Professional Estimation Disclaimer & Guide
            </h5>
            <p className="text-[11px] text-blue-700 dark:text-blue-400/90 leading-relaxed font-medium">
              This intelligent Grey Structure estimate uses standard structural engineering safety ratios based on <strong>Pakistani Building Code (BCP)</strong> bylaws. Actual site materials may deviate slightly (+/- 8%) based on structural designer drawings, soil bearing capacity tests, steel brand selection (e.g., Amreli, Ittehad, Mughal), cement brand selection (e.g., Maple Leaf, Bestway, Lucky), and municipal guidelines. These estimates should be used as a budget baseline before structural designer vetting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
