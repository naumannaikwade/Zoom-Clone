import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();

export const useAuth=()=>{
    const context=useContext(AuthContext);
    if(!context){
        throw new Error("useAuth must be used within an AuthProvider")
    };
    return context;
};

export const AuthProvider=({children})=>{
    const [user,setUser]=useState(null);
    const [loading,setLoading]=useState(true);

    useEffect(()=>{
        checkAuth();
    },[]);

    const checkAuth=async()=>{
        try{
            const token=localStorage.getItem("token");
            if(token){
                const response=await authAPI.getMe();
                setUser(response.data.data);
            }
        } catch(error){
            localStorage.removeItem("token");

        } finally {
            setLoading(false);
        }
    };

    const login=async(email,password)=>{
        const response =await authAPI.login(email,password);
        const {token,...userData}=response.data.data;
        localStorage.setItem("token",token);
        setUser(userData);
        return response.data;
    };

    const register=async(name,email,password)=>{
        const response=await authAPI.register(name,email,password);
        const {token,...userData}=response.data.data;
        localStorage.setItem("token",token);
        setUser(userData);
        return response.data;
    };

    const logout=()=>{
        localStorage.removeItem("token");
        setUser(null);
    };

    const value={user,login,register,logout,loading};

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}