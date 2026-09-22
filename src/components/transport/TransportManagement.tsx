import React, { useState, useEffect } from 'react';
import {
  VehicleItem,
  TransportRoute,
  TransportStoppage,
  TransportAssignment,
  Student,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  SAMPLE_VEHICLES,
  SAMPLE_ROUTES,
  SAMPLE_TRANSPORT_ASSIGNMENTS,
} from '../operations/sampleOperationsData';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Calendar,
  DollarSign,
  Filter,
  Trash2,
  Edit,
  X,
  Navigation,
  FileSpreadsheet,
} from 'lucide-react';

export const TransportManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit } = useApp();

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'routes' | 'vehicles' | 'students'>('routes');

  // Database State
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

  // New Vehicle Form State
  const [vehicleForm, setVehicleForm] = useState<Partial<VehicleItem>>({
    registrationNumber: 'ঢাকা মেট্রো-চ ',
    vehicleType: 'bus',
    capacity: 40,
    driverName: '',
    driverPhone: '',
    driverLicenseNumber: '',
    helperName: '',
    helperPhone: '',
    fitnessExpiryDate: '2027-12-31',
    taxTokenExpiryDate: '2026-12-31',
    status: 'active',
  });

  // Route Form State
  const [routeForm, setRouteForm] = useState<{
    routeName: string;
    bengaliRouteName: string;
    startPoint: string;
    destination: string;
    vehicleId: string;
    stoppages: TransportStoppage[];
  }>({
    routeName: '',
    bengaliRouteName: '',
    startPoint: '',
    destination: 'Campus Main Gate',
    vehicleId: '',
    stoppages: [
      { id: 'stp-1', name: 'Starting Point', pickupTime: '07:00 AM', dropTime: '03:00 PM', monthlyFare: 1200 },
    ],
  });

  // Assignment Form State
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    studentName: '',
    className: '',
    rollNumber: 1,
    routeId: '',
    stoppageId: '',
  });

  // Load from IndexedDB with fallback seeding
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vehList, routeList, assignList, studentList] = await Promise.all([
        getAll<VehicleItem>('vehicles'),
        getAll<TransportRoute>('routes'),
        getAll<TransportAssignment>('transportAssignments'),
        getAll<Student>('students'),
      ]);

      if (!vehList || vehList.length === 0) {
        for (const v of SAMPLE_VEHICLES) {
          await add('vehicles', v);
        }
        setVehicles(SAMPLE_VEHICLES);
      } else {
        setVehicles(vehList);
      }

      if (!routeList || routeList.length === 0) {
        for (const r of SAMPLE_ROUTES) {
          await add('routes', r);
        }
        setRoutes(SAMPLE_ROUTES);
      } else {
        setRoutes(routeList);
      }

      if (!assignList || assignList.length === 0) {
        for (const a of SAMPLE_TRANSPORT_ASSIGNMENTS) {
          await add('transportAssignments', a);
        }
        setAssignments(SAMPLE_TRANSPORT_ASSIGNMENTS);
      } else {
        setAssignments(assignList);
      }

      setStudents(studentList || []);
    } catch (err) {
      console.error('Failed to load transport data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id]);

  // Handle Save Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.registrationNumber || !vehicleForm.driverName) return;

    try {
      if (editingVehicle) {
        const updated: VehicleItem = {
          ...editingVehicle,
          ...(vehicleForm as VehicleItem),
          updatedAt: new Date().toISOString(),
        };
        await update('vehicles', updated);
        logAudit('Update Vehicle', 'operations' as any, `Updated vehicle ${updated.registrationNumber}`, updated.id);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      } else {
        const item: VehicleItem = {
          id: `veh-${Date.now()}`,
          instituteId: activeInstitute?.id || 'inst-01',
          registrationNumber: vehicleForm.registrationNumber || '',
          vehicleType: vehicleForm.vehicleType || 'bus',
          capacity: Number(vehicleForm.capacity) || 30,
          driverName: vehicleForm.driverName || '',
          driverPhone: vehicleForm.driverPhone || '',
          driverLicenseNumber: vehicleForm.driverLicenseNumber,
          helperName: vehicleForm.helperName,
          helperPhone: vehicleForm.helperPhone,
          fitnessExpiryDate: vehicleForm.fitnessExpiryDate,
          taxTokenExpiryDate: vehicleForm.taxTokenExpiryDate,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('vehicles', item);
        logAudit('Add Vehicle', 'operations' as any, `Added new fleet vehicle ${item.registrationNumber}`, item.id);
        setVehicles((prev) => [item, ...prev]);
      }

      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
    } catch (err) {
      console.error('Failed to save vehicle:', err);
    }
  };

  // Handle Save Route
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.routeName) return;

    try {
      const matchedVeh = vehicles.find((v) => v.id === routeForm.vehicleId);

      if (editingRoute) {
        const updated: TransportRoute = {
          ...editingRoute,
          routeName: routeForm.routeName,
          bengaliRouteName: routeForm.bengaliRouteName,
          startPoint: routeForm.startPoint,
          destination: routeForm.destination,
          vehicleId: routeForm.vehicleId,
          vehicleReg: matchedVeh?.registrationNumber,
          driverName: matchedVeh?.driverName,
          driverPhone: matchedVeh?.driverPhone,
          stoppages: routeForm.stoppages,
          updatedAt: new Date().toISOString(),
        };
        await update('routes', updated);
        logAudit('Update Route', 'transport', `Updated transport route ${updated.routeName}`, updated.id);
        setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const newRoute: TransportRoute = {
          id: `route-${Date.now()}`,
          instituteId: activeInstitute?.id || 'inst-01',
          routeName: routeForm.routeName,
          bengaliRouteName: routeForm.bengaliRouteName,
          startPoint: routeForm.startPoint,
          destination: routeForm.destination,
          vehicleId: routeForm.vehicleId,
          vehicleReg: matchedVeh?.registrationNumber,
          driverName: matchedVeh?.driverName,
          driverPhone: matchedVeh?.driverPhone,
          stoppages: routeForm.stoppages,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('routes', newRoute);
        logAudit('Add Route', 'transport', `Added new route ${newRoute.routeName}`, newRoute.id);
        setRoutes((prev) => [newRoute, ...prev]);
      }

      setIsRouteModalOpen(false);
      setEditingRoute(null);
    } catch (err) {
      console.error('Failed to save route:', err);
    }
  };

  // Handle Add Stoppage Row in Route Modal
  const handleAddStoppageRow = () => {
    const newStp: TransportStoppage = {
      id: `stp-${Date.now()}`,
      name: 'New Stoppage',
      pickupTime: '07:15 AM',
      dropTime: '02:45 PM',
      monthlyFare: 1200,
    };
    setRouteForm((prev) => ({
      ...prev,
      stoppages: [...prev.stoppages, newStp],
    }));
  };

  // Handle Remove Stoppage Row
  const handleRemoveStoppageRow = (index: number) => {
    setRouteForm((prev) => ({
      ...prev,
      stoppages: prev.stoppages.filter((_, i) => i !== index),
    }));
  };

  // Handle Assign Student
  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const route = routes.find((r) => r.id === assignForm.routeId);
    const stop = route?.stoppages.find((s) => s.id === assignForm.stoppageId);
    if (!route || !stop || !assignForm.studentName) return;

    try {
      const assignment: TransportAssignment = {
        id: `t-assign-${Date.now()}`,
        instituteId: activeInstitute?.id || 'inst-01',
        academicYearId: activeAcademicYear?.id || 'ay-2026',
        studentId: assignForm.studentId || `stu-${Date.now()}`,
        studentName: assignForm.studentName,
        className: assignForm.className || 'Class 10',
        rollNumber: Number(assignForm.rollNumber) || 1,
        routeId: route.id,
        routeName: route.routeName,
        stoppageId: stop.id,
        stoppageName: stop.name,
        monthlyFee: stop.monthlyFare || 1200,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await add('transportAssignments', assignment);
      logAudit('Assign Transport', 'operations' as any, `Assigned ${assignment.studentName} to ${route.routeName}`, assignment.id);
      setAssignments((prev) => [assignment, ...prev]);
      setIsAssignModalOpen(false);
    } catch (err) {
      console.error('Failed to assign student to transport:', err);
    }
  };

  // KPI Calculations
  const totalVehicles = vehicles.length;
  const totalCapacity = vehicles.reduce((acc, v) => acc + (v.capacity || 0), 0);
  const totalActiveRoutes = routes.filter((r) => r.status === 'active').length;
  const totalAssignedStudents = assignments.filter((a) => a.status === 'active').length;
  const monthlyRevenue = assignments.reduce((acc, a) => acc + (a.monthlyFee || 0), 0);

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-6 h-6 text-sky-600" />
              <span>
                {language === 'bn' ? 'পরিবহন ও বাস বহর ব্যবস্থাপনা' : 'Fleet & Transport Management'}
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
              Phase 12 • Routes & Fleet
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'স্কুল বাস বহর, রুট ও স্টপেজ সময়সূচি, ড্রাইভারের তথ্য, ফিটনেস সনদ এবং শিক্ষার্থী আসন বরাদ্দ'
              : 'School bus fleet tracking, route schedules, pickup stops, BRTA fitness compliance, and student seat assignments'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'routes' && (
            <button
              onClick={() => {
                setEditingRoute(null);
                setRouteForm({
                  routeName: '',
                  bengaliRouteName: '',
                  startPoint: '',
                  destination: 'Campus Main Gate',
                  vehicleId: vehicles[0]?.id || '',
                  stoppages: [
                    { id: 'stp-1', name: 'Start Station', pickupTime: '07:00 AM', dropTime: '03:00 PM', monthlyFare: 1200 },
                  ],
                });
                setIsRouteModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন রুট যোগ করুন' : 'Add New Route'}</span>
            </button>
          )}

          {activeSubTab === 'vehicles' && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setVehicleForm({
                  registrationNumber: 'ঢাকা মেট্রো-চ ',
                  vehicleType: 'bus',
                  capacity: 40,
                  driverName: '',
                  driverPhone: '',
                  fitnessExpiryDate: '2027-12-31',
                  taxTokenExpiryDate: '2026-12-31',
                  status: 'active',
                });
                setIsVehicleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন যানবাহন যোগ' : 'Add Fleet Vehicle'}</span>
            </button>
          )}

          {activeSubTab === 'students' && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'শিক্ষার্থী বরাদ্দ' : 'Allocate Student'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-1">
            <Bus className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'যানবাহন বহর' : 'Fleet Vehicles'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{totalVehicles}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Buses & Microbuses</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Navigation className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'সক্রিয় রুট' : 'Active Routes'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{totalActiveRoutes}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scheduled daily</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মোট আসন সংখ্যা' : 'Seating Capacity'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{totalCapacity}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total passenger capacity</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'বরাদ্দ শিক্ষার্থী' : 'Enrolled Students'}
            </span>
          </div>
          <div className="text-xl font-bold text-teal-600">{totalAssignedStudents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Transport card holders</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মাসিক ভাড়া' : 'Monthly Fares'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            ৳ {monthlyRevenue.toLocaleString('en-BD')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recurring revenue</div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('routes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'routes'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Routes & Stoppages ({routes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'vehicles'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Fleet & Vehicles ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'students'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Allocated Students ({assignments.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. ROUTES & STOPPAGES VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {routes.map((rt) => (
            <div
              key={rt.id}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-sky-600" />
                      <span>{rt.routeName}</span>
                    </h3>
                    {rt.bengaliRouteName && (
                      <p className="text-xs text-slate-500 font-serif mt-0.5">{rt.bengaliRouteName}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Active Route
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Bus</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                      {rt.vehicleReg || 'Pending Allocation'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Driver / Contact</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                      {rt.driverName || 'N/A'}
                    </span>
                    {rt.driverPhone && (
                      <span className="text-[10px] text-sky-600 block">{rt.driverPhone}</span>
                    )}
                  </div>
                </div>

                {/* Stoppages Timeline */}
                <div className="mt-4">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Stoppages & Timetable ({rt.stoppages?.length || 0} stops)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Morning Pickup / Afternoon Drop</span>
                  </div>

                  <div className="space-y-2">
                    {rt.stoppages?.map((stop, idx) => (
                      <div
                        key={stop.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{stop.name}</div>
                            {stop.bengaliName && (
                              <div className="text-[10px] text-slate-400 font-serif">{stop.bengaliName}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                            {stop.pickupTime} • {stop.dropTime}
                          </div>
                          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            ৳ {stop.monthlyFare}/mo
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Total Allocated: {assignments.filter((a) => a.routeId === rt.id).length} students
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingRoute(rt);
                      setRouteForm({
                        routeName: rt.routeName,
                        bengaliRouteName: rt.bengaliRouteName || '',
                        startPoint: rt.startPoint,
                        destination: rt.destination,
                        vehicleId: rt.vehicleId || '',
                        stoppages: rt.stoppages || [],
                      });
                      setIsRouteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FLEET & VEHICLES VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'vehicles' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Registration Plate</th>
                  <th className="px-4 py-3">Type & Capacity</th>
                  <th className="px-4 py-3">Assigned Driver</th>
                  <th className="px-4 py-3">Contact Phone</th>
                  <th className="px-4 py-3">License No.</th>
                  <th className="px-4 py-3">Fitness Expiry</th>
                  <th className="px-4 py-3">Tax Token Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white font-serif whitespace-nowrap">
                      {v.registrationNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold capitalize text-slate-900 dark:text-white">{v.vehicleType}</div>
                      <div className="text-[10px] text-slate-400">{v.capacity} Passenger Seats</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {v.driverName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {v.driverPhone}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {v.driverLicenseNumber || 'DL-PENDING'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                      {v.fitnessExpiryDate || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                      {v.taxTokenExpiryDate || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 capitalize">
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingVehicle(v);
                          setVehicleForm(v);
                          setIsVehicleModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ALLOCATED STUDENTS VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class & Roll</th>
                    <th className="px-4 py-3">Assigned Route</th>
                    <th className="px-4 py-3">Pickup Stoppage</th>
                    <th className="px-4 py-3">Monthly Fare</th>
                    <th className="px-4 py-3">Assigned Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.map((as) => (
                    <tr key={as.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {as.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {as.className} (Roll {as.rollNumber})
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {as.routeName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {as.stoppageName}
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-600">
                        ৳ {as.monthlyFee}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {as.assignedDate}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT ROUTE */}
      {/* ======================================================== */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-xl w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" />
                <span>{editingRoute ? 'Edit Route & Stops' : 'Create New Transport Route'}</span>
              </h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Route Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeForm.routeName}
                    onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                    placeholder="e.g. Route 1: Mirpur-10 to Campus"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রুটের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={routeForm.bengaliRouteName}
                    onChange={(e) => setRouteForm({ ...routeForm, bengaliRouteName: e.target.value })}
                    placeholder="রুট ১: মিরপুর হতে ক্যাম্পাস"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Fleet Vehicle
                  </label>
                  <select
                    value={routeForm.vehicleId}
                    onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} ({v.driverName} - Cap: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Starting Location
                  </label>
                  <input
                    type="text"
                    value={routeForm.startPoint}
                    onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                    placeholder="e.g. Mirpur-10 Roundabout"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Stoppages Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Route Stoppages & Fares ({routeForm.stoppages.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddStoppageRow}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stoppage</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {routeForm.stoppages.map((st, idx) => (
                    <div key={st.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Stop name"
                        value={st.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRouteForm((prev) => ({
                            ...prev,
                            stoppages: prev.stoppages.map((s, i) => (i === idx ? { ...s, name: val } : s)),
                          }));
                        }}
                        className="flex-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-xs"
                      />

                      <input
                        type="text"
                        placeholder="Pickup"
                        value={st.pickupTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRouteForm((prev) => ({
                            ...prev,
                            stoppages: prev.stoppages.map((s, i) => (i === idx ? { ...s, pickupTime: val } : s)),
                          }));
                        }}
                        className="w-20 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono text-xs"
                      />

                      <input
                        type="number"
                        placeholder="Fare ৳"
                        value={st.monthlyFare}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRouteForm((prev) => ({
                            ...prev,
                            stoppages: prev.stoppages.map((s, i) => (i === idx ? { ...s, monthlyFare: val } : s)),
                          }));
                        }}
                        className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveStoppageRow(idx)}
                        disabled={routeForm.stoppages.length <= 1}
                        className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingRoute ? 'Update Route' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT FLEET VEHICLE */}
      {/* ======================================================== */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-sky-600" />
                <span>{editingVehicle ? 'Edit Vehicle Record' : 'Add Fleet Vehicle'}</span>
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  BRTA Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.registrationNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                  placeholder="ঢাকা মেট্রো-চ ১১-৮৮৯০"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="bus">Standard Bus (40-50 seats)</option>
                    <option value="minibus">Minibus (28-35 seats)</option>
                    <option value="microbus">Microbus (12-15 seats)</option>
                    <option value="van">Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Passenger Capacity
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    placeholder="Driver name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.driverPhone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    placeholder="017XX-XXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fitness Certificate Expiry
                  </label>
                  <input
                    type="date"
                    value={vehicleForm.fitnessExpiryDate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fitnessExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tax Token Expiry
                  </label>
                  <input
                    type="date"
                    value={vehicleForm.taxTokenExpiryDate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, taxTokenExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ALLOCATE STUDENT TO ROUTE */}
      {/* ======================================================== */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Allocate Student to Transport Route</span>
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-3 text-xs">
              {students.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Enrolled Student
                  </label>
                  <select
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      if (st) {
                        setAssignForm((prev) => ({
                          ...prev,
                          studentId: st.id,
                          studentName: `${st.firstName} ${st.lastName}`,
                          className: `Class ${st.classId || '10'}`,
                          rollNumber: st.rollNumber,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose student --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.firstName} {st.lastName} (Roll: {st.rollNumber} - Class {st.classId || '10'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignForm.studentName}
                    onChange={(e) => setAssignForm({ ...assignForm, studentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class & Roll
                  </label>
                  <input
                    type="text"
                    value={assignForm.className}
                    onChange={(e) => setAssignForm({ ...assignForm, className: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Transport Route *
                </label>
                <select
                  required
                  value={assignForm.routeId}
                  onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value, stoppageId: '' })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName}
                    </option>
                  ))}
                </select>
              </div>

              {assignForm.routeId && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Pickup Stoppage *
                  </label>
                  <select
                    required
                    value={assignForm.stoppageId}
                    onChange={(e) => setAssignForm({ ...assignForm, stoppageId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Stoppage --</option>
                    {routes
                      .find((r) => r.id === assignForm.routeId)
                      ?.stoppages.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.pickupTime} - ৳ {st.monthlyFare}/mo)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
