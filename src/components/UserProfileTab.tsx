import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Stack
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import type { UserProfile } from "../types";
import { updateUser } from "../api/userServices";

const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;

const existingUser = {
  name: user.name,
  email: user.email,
  password: "",
  role: user.role,
  company: user.c_name,
  profilePic: "https://i.pravatar.cc/150?img=3"
};

export function UserProfileTab() {
  const [user, setUser] = useState(existingUser);
  const [edit, setEdit] = useState(false);
  const [profilePic, setProfilePic] = useState(existingUser.profilePic);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target && typeof ev.target.result === "string") {
          setProfilePic(ev.target.result);
          setUser({ ...user, profilePic: ev.target.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
  if (!user.password || user.password.trim() === "") {
    toast.error("Debes ingresar tu contraseña para guardar los cambios.");
    return;
  }
  try {
    await updateUser(
      user.name,
      user.email,
      user.password,
      existingUser.company || ""
    );
    setEdit(false);
    toast.success("Perfil actualizado correctamente");
  } catch (_error) {
    toast.error("Error al actualizar el perfil");
  }
};

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, width: "100%" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Perfil de usuario
      </Typography>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          maxWidth: 500,
          mx: "auto",
          background: "rgba(245, 245, 255, 0.95)", // Lighter color
          color: "#23243a",
          fontFamily: 'Montserrat, Arial, sans-serif',
        }}
      >
        <Stack alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profilePic}
              alt={user.company}
              sx={{ width: 100, height: 100, mb: 1, border: "3px solid #8B5CF6" }}
            />
            {edit && (
              <IconButton
                component="label"
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#fff",
                  color: "#8B5CF6",
                  "&:hover": { background: "#E05EFF", color: "#fff" }
                }}
              >
                <EditIcon />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePicChange}
                />
              </IconButton>
            )}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {user.company}
          </Typography>
          <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
            {user.role}
          </Typography>
        </Stack>
        <Box component="form" autoComplete="off">
          <TextField
            label="Nombre"
            name="name"
            value={user.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!edit}
            InputProps={{
              style: { color: "#23243a" }
            }}
            InputLabelProps={{
              style: { color: "#8B5CF6" }
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#8B5CF6" },
                "&:hover fieldset": { borderColor: "#E05EFF" },
                "&.Mui-focused fieldset": { borderColor: "#E05EFF" }
              }
            }}
          />
          <TextField
            label="Correo Electronico"
            name="email"
            type="email"
            value={user.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!edit}
            InputProps={{
              style: { color: "#23243a" }
            }}
            InputLabelProps={{
              style: { color: "#8B5CF6" }
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#8B5CF6" },
                "&:hover fieldset": { borderColor: "#E05EFF" },
                "&.Mui-focused fieldset": { borderColor: "#E05EFF" }
              }
            }}
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Introduce tu contraseña para guardar cambios"
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!edit}
            required={edit}
          />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            {edit ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                sx={{
                  background: "linear-gradient(90deg, #E05EFF 0%, #8B5CF6 50%, #3B82F6 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  px: 4,
                  borderRadius: 3,
                  "&:hover": {
                    background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #E05EFF 100%)"
                  }
                }}
                onClick={handleSave}
              >
                Guardar
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EditIcon />}
                sx={{
                  color: "#8B5CF6",
                  borderColor: "#8B5CF6",
                  fontWeight: 700,
                  px: 4,
                  borderRadius: 3,
                  "&:hover": {
                    background: "#E05EFF22",
                    borderColor: "#E05EFF"
                  }
                }}
                onClick={() => setEdit(true)}
              >
                Editar perfil
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}