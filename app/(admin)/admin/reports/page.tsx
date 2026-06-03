"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign, TrendingUp, ShoppingBag, Gamepad2, Users,
  Calendar, Download, Loader2, UtensilsCrossed, BarChart3, PieChart
} from "lucide-react";
import { toast } from "sonner";
import {
  getDashboardSummary,
  getFoodReports,
  getDeviceReports,
  getRevenueReports,
  type ReportFilters
} from "./actions";

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "food" | "device" | "revenue">("overview");
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Overview data
  const [overviewData, setOverviewData] = useState<any>(null);

  // Food data
  const [foodData, setFoodData] = useState<any>(null);

  // Device data
  const [deviceData, setDeviceData] = useState<any>(null);

  // Revenue data
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const filters: ReportFilters = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    try {
      if (activeTab === "overview") {
        const result = await getDashboardSummary(filters);
        if (result.success) {
          setOverviewData(result.summary);
        }
      } else if (activeTab === "food") {
        const result = await getFoodReports(filters);
        if (result.success) {
          setFoodData(result);
        }
      } else if (activeTab === "device") {
        const result = await getDeviceReports(filters);
        if (result.success) {
          setDeviceData(result);
        }
      } else if (activeTab === "revenue") {
        const result = await getRevenueReports(filters);
        if (result.success) {
          setRevenueData(result);
        }
      }
    } catch (err) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleExport = () => {
    toast.success("Export feature coming soon!");
  };

  const setQuickDateRange = (preset: "today" | "7days" | "30days" | "month" | "90days" | "all") => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (preset) {
      case "today":
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case "7days":
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        setDateFrom(week.toISOString().split('T')[0]);
        setDateTo(todayStr);
        break;
      case "30days":
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        setDateFrom(month.toISOString().split('T')[0]);
        setDateTo(todayStr);
        break;
      case "month":
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateFrom(firstDay.toISOString().split('T')[0]);
        setDateTo(lastDay.toISOString().split('T')[0]);
        break;
      case "90days":
        const quarter = new Date(today);
        quarter.setDate(quarter.getDate() - 90);
        setDateFrom(quarter.toISOString().split('T')[0]);
        setDateTo(todayStr);
        break;
      case "all":
        setDateFrom("");
        setDateTo("");
        break;
    }
    // Auto-apply after setting dates
    setTimeout(() => handleApplyFilters(), 100);
  };

  const handleQuickDateFilter = (days: number | "today" | "month" | "all") => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (days === "today") {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (days === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateFrom(firstDay.toISOString().split('T')[0]);
      setDateTo(lastDay.toISOString().split('T')[0]);
    } else if (days === "all") {
      setDateFrom("");
      setDateTo("");
    } else {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      setDateFrom(fromDate.toISOString().split('T')[0]);
      setDateTo(todayStr);
    }
  };

  // Auto-load when quick filter changes
  useEffect(() => {
    if (dateFrom !== "" || dateTo !== "") {
      loadData();
    }
  }, [dateFrom, dateTo]);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "food", label: "Food Reports", icon: UtensilsCrossed },
    { id: "device", label: "Device Reports", icon: Gamepad2 },
    { id: "revenue", label: "Revenue Reports", icon: DollarSign }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">
            REPORTS & ANALYTICS
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Track performance and insights across all operations
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="border-[#27272a] text-zinc-400 hover:text-white font-black uppercase text-xs"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Filters */}
      <Card className="bg-[#121212] border-[#27272a] p-4 space-y-4">
        {/* Quick Filter Buttons */}
        <div>
          <Label className="text-[10px] font-black uppercase text-zinc-600 mb-2 block">
            Quick Filters
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickDateRange("today")}
              className="border-[#27272a] text-zinc-400 hover:text-black hover:bg-gradient-primary font-bold uppercase text-[10px] h-8 transition-all"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickDateRange("7days")}
              className="border-[#27272a] text-zinc-400 hover:text-black hover:bg-gradient-primary font-bold uppercase text-[10px] h-8 transition-all"
            >
              Last 7 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickDateRange("30days")}
              className="border-[#27272a] text-zinc-400 hover:text-black hover:bg-gradient-primary font-bold uppercase text-[10px] h-8 transition-all"
            >
              Last 30 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickDateRange("month")}
              className="border-[#27272a] text-zinc-400 hover:text-black hover:bg-gradient-primary font-bold uppercase text-[10px] h-8 transition-all"
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickDateRange("90days")}
              className="border-[#27272a] text-zinc-400 hover:text-black hover:bg-gradient-primary font-bold uppercase text-[10px] h-8 transition-all"
            >
              Last 90 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickDateRange("all")}
              className="border-[#27272a] text-zinc-400 hover:text-black hover:bg-gradient-primary font-bold uppercase text-[10px] h-8 transition-all"
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        <div>
          <Label className="text-[10px] font-black uppercase text-zinc-600 mb-2 block">
            Custom Date Range
          </Label>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-zinc-500">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#0a0a0a] border-zinc-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-zinc-500">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#0a0a0a] border-zinc-900 text-white"
                />
              </div>
            </div>
            <Button
              onClick={handleApplyFilters}
              className="bg-gradient-primary hover:bg-gradient-primary-hover text-black font-black uppercase text-xs h-10 glow-primary-hover"
            >
              Apply Custom Range
            </Button>
          </div>
        </div>

        {/* Active Filter Display */}
        {(dateFrom || dateTo) && (
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Calendar className="h-3 w-3 text-primary" />
              <span className="font-bold">
                Showing: {dateFrom ? new Date(dateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'All time'}
                {' → '}
                {dateTo ? new Date(dateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Now'}
              </span>
            </div>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                handleApplyFilters();
              }}
              className="text-[10px] font-black uppercase text-zinc-500 hover:text-primary transition-colors"
            >
              Clear Filter
            </button>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#27272a] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && overviewData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-green-500/70 mb-1">
                        Total Revenue
                      </p>
                      <h3 className="text-2xl font-black text-white">
                        ₹{overviewData.totalRevenue.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-blue-500/70 mb-1">
                        Device Revenue
                      </p>
                      <h3 className="text-2xl font-black text-white">
                        ₹{overviewData.deviceRevenue.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Gamepad2 className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-amber-500/70 mb-1">
                        Food Revenue
                      </p>
                      <h3 className="text-2xl font-black text-white">
                        ₹{overviewData.foodRevenue.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <UtensilsCrossed className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-purple-500/70 mb-1">
                        Total Bookings
                      </p>
                      <h3 className="text-2xl font-black text-white">
                        {overviewData.totalBookings}
                      </h3>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase text-zinc-500">
                      Food Orders
                    </p>
                    <ShoppingBag className="h-4 w-4 text-zinc-600" />
                  </div>
                  <h4 className="text-xl font-black text-white">
                    {overviewData.totalFoodOrders}
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1">
                    {overviewData.totalItemsSold} items sold
                  </p>
                </Card>

                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase text-zinc-500">
                      Hours Booked
                    </p>
                    <Calendar className="h-4 w-4 text-zinc-600" />
                  </div>
                  <h4 className="text-xl font-black text-white">
                    {overviewData.totalHoursBooked}
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1">
                    Total gaming hours
                  </p>
                </Card>

                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase text-zinc-500">
                      Avg Revenue
                    </p>
                    <TrendingUp className="h-4 w-4 text-zinc-600" />
                  </div>
                  <h4 className="text-xl font-black text-white">
                    ₹{(overviewData.totalRevenue / (overviewData.totalBookings || 1)).toFixed(0)}
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1">
                    Per booking
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* Food Reports Tab */}
          {activeTab === "food" && foodData && (
            <div className="space-y-6">
              {/* Food Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Total Revenue
                  </p>
                  <h3 className="text-2xl font-black text-primary">
                    ₹{foodData.summary.totalRevenue.toLocaleString('en-IN')}
                  </h3>
                </Card>
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Items Sold
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    {foodData.summary.totalItemsSold}
                  </h3>
                </Card>
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Total Orders
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    {foodData.summary.totalOrders}
                  </h3>
                </Card>
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Avg Order Value
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    ₹{foodData.summary.averageOrderValue.toFixed(0)}
                  </h3>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card className="bg-[#121212] border-[#27272a] p-6">
                <h3 className="text-sm font-black uppercase text-zinc-400 mb-4">
                  Category Breakdown
                </h3>
                <div className="space-y-3">
                  {foodData.categoryBreakdown.map((category: any) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {category.category}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {category.totalQuantity} items • {category.itemCount} unique items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">
                          ₹{category.totalRevenue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9px] text-zinc-600 uppercase">
                          {((category.totalRevenue / foodData.summary.totalRevenue) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Items */}
              <Card className="bg-[#121212] border-[#27272a] p-6">
                <h3 className="text-sm font-black uppercase text-zinc-400 mb-4">
                  Top Selling Items
                </h3>
                <div className="space-y-2">
                  {foodData.topItems.map((item: any, idx: number) => (
                    <div
                      key={item.itemName}
                      className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.itemName}</p>
                          <p className="text-xs text-zinc-600">
                            {item.category} • {item.totalQuantity} sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">
                          ₹{item.totalRevenue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9px] text-zinc-600 uppercase">
                          {item.orderCount} orders
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Device Reports Tab */}
          {activeTab === "device" && deviceData && (
            <div className="space-y-6">
              {/* Device Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Total Revenue
                  </p>
                  <h3 className="text-2xl font-black text-primary">
                    ₹{deviceData.summary.totalRevenue.toLocaleString('en-IN')}
                  </h3>
                </Card>
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Total Bookings
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    {deviceData.summary.totalBookings}
                  </h3>
                </Card>
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Hours Booked
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    {deviceData.summary.totalHours}
                  </h3>
                </Card>
                <Card className="bg-[#121212] border-[#27272a] p-5">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Avg Revenue
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    ₹{deviceData.summary.averageRevenuePerBooking.toFixed(0)}
                  </h3>
                </Card>
              </div>

              {/* Device Type Breakdown */}
              <Card className="bg-[#121212] border-[#27272a] p-6">
                <h3 className="text-sm font-black uppercase text-zinc-400 mb-4">
                  Device Type Performance
                </h3>
                <div className="space-y-3">
                  {deviceData.deviceBreakdown.map((device: any) => (
                    <div
                      key={device.deviceType}
                      className="p-4 bg-[#0a0a0a] border border-[#27272a] rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-black text-white">
                          {device.deviceType}
                        </h4>
                        <p className="text-lg font-black text-primary">
                          ₹{device.totalRevenue.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-zinc-600">Bookings</p>
                          <p className="font-bold text-white">{device.totalBookings}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Hours</p>
                          <p className="font-bold text-white">{device.totalHours}h</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Avg Players</p>
                          <p className="font-bold text-white">
                            {device.averagePlayersPerBooking.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Extra Player Rev</p>
                          <p className="font-bold text-primary">
                            ₹{device.extraPlayerRevenue.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Revenue Reports Tab */}
          {activeTab === "revenue" && revenueData && (
            <div className="space-y-6">
              {/* Revenue Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 p-6">
                  <p className="text-xs font-black uppercase text-green-500/70 mb-2">
                    Total Revenue
                  </p>
                  <h3 className="text-3xl font-black text-white mb-4">
                    ₹{revenueData.summary.totalRevenue.toLocaleString('en-IN')}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Device Revenue:</span>
                      <span className="font-bold text-white">
                        ₹{revenueData.summary.deviceRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Food Revenue:</span>
                      <span className="font-bold text-white">
                        ₹{revenueData.summary.foodRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#121212] border-[#27272a] p-6">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Payment Status
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500">Paid</span>
                        <span className="text-sm font-black text-green-500">
                          {revenueData.summary.paidBookings}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${(revenueData.summary.paidBookings / revenueData.summary.totalBookings) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500">Pending</span>
                        <span className="text-sm font-black text-amber-500">
                          {revenueData.summary.pendingBookings}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{
                            width: `${(revenueData.summary.pendingBookings / revenueData.summary.totalBookings) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#121212] border-[#27272a] p-6">
                  <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                    Revenue Split
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500">Device</span>
                        <span className="text-sm font-black text-blue-500">
                          {revenueData.summary.deviceRevenuePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${revenueData.summary.deviceRevenuePercentage}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-500">Food</span>
                        <span className="text-sm font-black text-amber-500">
                          {revenueData.summary.foodRevenuePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${revenueData.summary.foodRevenuePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Booking Source Breakdown */}
              <Card className="bg-[#121212] border-[#27272a] p-6">
                <h3 className="text-sm font-black uppercase text-zinc-400 mb-4">
                  Revenue by Source
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {revenueData.sourceBreakdown.map((source: any) => (
                    <div
                      key={source.source}
                      className="p-4 bg-[#0a0a0a] border border-[#27272a] rounded-lg"
                    >
                      <p className="text-xs font-black uppercase text-zinc-500 mb-2">
                        {source.source === "walk_in" ? "Walk-In" : "Online"}
                      </p>
                      <h4 className="text-xl font-black text-primary mb-1">
                        ₹{source.totalRevenue.toLocaleString('en-IN')}
                      </h4>
                      <p className="text-xs text-zinc-600">
                        {source.bookingCount} bookings
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Daily Revenue Chart */}
              <Card className="bg-[#121212] border-[#27272a] p-6">
                <h3 className="text-sm font-black uppercase text-zinc-400 mb-4">
                  Daily Revenue Trend
                </h3>
                <div className="space-y-2">
                  {revenueData.dailyRevenue.slice(-10).map((day: any) => {
                    const maxRevenue = Math.max(...revenueData.dailyRevenue.map((d: any) => d.totalRevenue));
                    const percentage = (day.totalRevenue / maxRevenue) * 100;

                    return (
                      <div key={day.date} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">
                            {new Date(day.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="font-bold text-white">
                            ₹{day.totalRevenue.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden">
                          <div className="flex h-full">
                            <div
                              className="bg-blue-500"
                              style={{
                                width: `${(day.deviceRevenue / day.totalRevenue) * percentage}%`
                              }}
                            />
                            <div
                              className="bg-amber-500"
                              style={{
                                width: `${(day.foodRevenue / day.totalRevenue) * percentage}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs text-zinc-500">Device</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span className="text-xs text-zinc-500">Food</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
