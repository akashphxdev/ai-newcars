import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/layout/AdminLayout";

// ── Page imports (apne actual pages se replace karo) ──────────────────────────
import Dashboard from "./pages/Dashboard";
import AllAdmins from "./pages/AdminUsers/AllAdmins/AllAdmins";
import AllPermissions from "./pages/AdminUsers/Permission/AllPermissions";
import AllRoles from "./pages/AdminUsers/Roles/AllRoles";
import AllAdminLogs from "./pages/AdminUsers/AdminLogs/AllAdminLogs";
import { AuthProvider } from "./context/AuthContext";
import AllCountries from "./pages/Locations/Countries/AllCountries";
import AllStates from "./pages/Locations/States/AllStates";
import AllDistricts from "./pages/Locations/Districts/AllDistricts";
import AllCities from "./pages/Locations/Cities/AllCities";
import AllBrands from "./pages/newCars/Brands/AllBrands";
import AllCarModels from "./pages/newCars/carModels/AllCarModels";
import AllVariants from "./pages/newCars/Variants/AllVariants";
import AllPowertrainElectric from "./pages/newCars/PowertrainElectric/AllPowertrainElectric";
import AllPowertrainIce from "./pages/newCars/PowertrainIce/AllPowertrainIce";
import NotFound from "./pages/NotFound";
import AllColorsImages from "./pages/newCars/ColorsImages/AllColorsImages";
import AllFeatures from "./pages/newCars/Features/AllFeatures";
import AllFaqs from "./pages/newCars/Faqs/AllFaqs";
import AllOffers from "./pages/newCars/Offers/AllOffers";
import AllVideos from "./pages/newCars/Videos/AllVideos";
// ── Auth guard — baad mein real auth logic lagao ──────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = !!localStorage.getItem("admin_token"); // apna auth check yahan
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected admin routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admins" element={<AllAdmins />} />
          <Route path="roles" element={<AllRoles />} />
          <Route path="permissions" element={<AllPermissions />} />
          <Route path="adminlogs" element={<AllAdminLogs />} />
          <Route path="countries" element={<AllCountries />} />
          <Route path="states" element={<AllStates />} />
          <Route path="districts" element={<AllDistricts />} />
          <Route path="cities" element={<AllCities />} />
          <Route path ="/new-cars/brands" element={<AllBrands/>}/>
          <Route path ="/new-cars/models" element={<AllCarModels/>}/>
          <Route path ="/new-cars/variants" element={<AllVariants/>}/>
          <Route path ="/new-cars/powertrain-eletric" element={<AllPowertrainElectric/>}/>
          <Route path ="/new-cars/powertrain-ice" element={<AllPowertrainIce/>}/>
          <Route path ="/new-cars/colors" element={<AllColorsImages/>}/>
          <Route path ="/new-cars/features" element={<AllFeatures/>}/>
          <Route path ="/new-cars/offers" element={<AllOffers/>}/>
          <Route path ="/new-cars/faqs" element={<AllFaqs/>}/>
          <Route path ="/new-cars/videos" element={<AllVideos/>}/>
 

           
        </Route>

        {/* unknown path → NotFound */}
        <Route path ="*" element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
     </AuthProvider>
  );
}