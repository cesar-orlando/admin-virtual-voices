import React, { useEffect, useState } from "react";
import { fetchCompanyUsers } from "../api/servicios";
import type { UserProfile } from '../types';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, FormControl, InputLabel, Select, MenuItem, Box
} from "@mui/material";

export function UsersTab() {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
    const [userData, setUsers] = useState<UserProfile[]>([]);
    const [filter, setFilter] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "email">("name");
    const [roleFilter, setRoleFilter] = useState("Todos");

    useEffect(() => {
    const loadData = async () => {
        const fetchedCompanyUsers = await fetchCompanyUsers(user.c_name || '');
        setUsers(fetchedCompanyUsers);
    };

    loadData();
    }, [user.c_name, user.id]);

    const filteredData = userData
    .filter(user =>
        user.name.toLowerCase().includes(filter.toLowerCase()) &&
        (roleFilter === "Todos" || user.role === roleFilter)
    )
    .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

    return (
        <><Box sx={{ mb: 2, display: "flex", gap: 2 }}>
    <TextField
        label="Filter by name"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        variant="outlined"
        size="small"
    />
    <FormControl size="small">
        <InputLabel>Sort by</InputLabel>
        <Select
        value={sortBy}
        label="Sort by"
        onChange={e => setSortBy(e.target.value as "name" | "email")}
        >
        <MenuItem value="name">Name</MenuItem>
        <MenuItem value="email">Email</MenuItem>
        </Select>
    </FormControl>
    <FormControl size="small">
        <InputLabel>Role</InputLabel>
        <Select
        value={roleFilter}
        label="Role"
        onChange={e => setRoleFilter(e.target.value)}
        >
        <MenuItem value="Todos">Todos</MenuItem>
        <MenuItem value="Admin">Admin</MenuItem>
        <MenuItem value="Usuario">Usuario</MenuItem>
        </Select>
    </FormControl>
    </Box>

    <TableContainer component={Paper}>
    <Table>
        <TableHead>
        <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
        </TableRow>
        </TableHead>
        <TableBody>
        {filteredData.length > 0 ? (
            filteredData.map((user, idx) => (
            <TableRow key={idx}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
            </TableRow>
            ))
        ) : (
            <TableRow>
            <TableCell colSpan={3}>No users found.</TableCell>
            </TableRow>
        )}
        </TableBody>
    </Table>
    </TableContainer></>
    );
}