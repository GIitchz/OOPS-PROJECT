// src/pages/Profile.jsx
import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, ChangeEvent, FormEvent } from "react";
import { AuthContext } from '../context/AuthContext';
import { getLatLongFromAddress } from "../utils/Geo"; 

import {
  getSavedAddresses,
  saveAddressForUser,
  updateSavedAddress,
  deleteSavedAddress
} from "../utils/AdressDB";

import './Profile.css';
import Supabase from "../utils/Database";
import { AddressInterface, UserInterface } from "../utils/Interfaces";
import RetailerProfileSidebar from "../components/SidebarLinks";
import { ProfileSettingsPage } from "./ProfileSettings";
import { ProfileOrdersPage } from "./ProfileOrders";
import { ProfileAddressesPage } from "./ProfileAddresses";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  return (
    <div className="profile-wrapper">
      <RetailerProfileSidebar />
      {user && !loading ? (
          <>
            <Routes>
              <Route path="" element={<ProfileWelcome user={user} />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
              <Route path="orders" element={<ProfileOrdersPage />} />
              <Route path="addresses" element={<ProfileAddressesPage />} />
            </Routes>
          </>
      ): (
        <h1>Loading...</h1>
      )}
    </div>
  )
}

function ProfileWelcome({ user }: {user:UserInterface}) {
  return (
    <h1 className="welcome-text">Welcome, {user.name || user.email}</h1>
  );
}

export default ProfilePage;
