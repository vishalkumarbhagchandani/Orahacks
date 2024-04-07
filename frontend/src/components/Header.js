import { useState } from "react";
import PropTypes from "prop-types";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
import Link from "@mui/material/Link";
import { NavLink } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../contexts/AuthContext";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import RecommendationButton from './FetchRecommendation';
import { handleClick } from './FetchRecommendation'; // Import the handleClick function

function Header(props) {
  const title = "Event Platform";
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(false); // State to control modal visibility
  const sections = [
    { title: "My Favourite ", url: "/topics/My Favourite " },
    { title: "Networking Events", url: "/topics/Networking Events" },
    { title: "Hackathons ", url: "/topics/Hackathons " },
    {
      title: "Musical ",
      url: "/topics/Musical ",
    },
    { title: "Travel", url: "/topics/Travel" },
    { title: "Sports", url: "/topics/Sports" },
    { title: "Health and Wellness", url: "/topics/Health and Wellness" },
    { title: "Technology", url: "/topics/Technology" },
    { title: "Travel", url: "/topics/Travel" },
    { title: "My Favourite ", url: "/topics/My Favourite " },
  ];
  const { currentUser, signout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    signout();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // Set state to open the modal
    setOpenModal(true);
  };

  return (
    <>
      <Container maxWidth="lg">
        <Toolbar sx={{ borderBottom: 1, borderColor: "divider" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                mr: 1, // Add right margin to match button
                bgcolor: 'background.paper',
                width: 'fit-content', // Set width to fit content
                '& .MuiInputBase-root': { // Access the root element of the input field
                  borderRadius: '4px', // Apply same border radius as button
                },
              }}
            />
            <Button variant="outlined" size="small" type="submit">Search</Button>
          </form>
          <Typography
            component="h2"
            variant="h5"
            color="inherit"
            align="center"
            noWrap
            sx={{ flex: 1 }}
          >
            {title}
          </Typography>
          {!currentUser?.email && (
            <NavLink to="/signin">
              <Button variant="outlined" size="small">
                Sign in
              </Button>
            </NavLink>
          )}
          {currentUser?.email && (
            <div>
              <Button
                id="basic-button"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={() => navigate("/")}
              >
                <HomeIcon />
              </Button>
              <Button
                id="basic-button"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                <PersonIcon />
              </Button>
              <Button
                id="basic-button"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={() => navigate("/notifications")}
              >
                <NotificationsIcon />
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                <MenuItem onClick={handleClose}>
                  <NavLink
                    to="/create-post"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    Create Post
                  </NavLink>
                </MenuItem>
                {currentUser?.role === "administrator" && (
                  <MenuItem onClick={handleClose}>
                    <NavLink
                      to="/manage-profiles"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      Manage Profiles
                    </NavLink>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
        <Toolbar
          component="nav"
          variant="dense"
          sx={{ justifyContent: "space-between", overflowX: "auto" }}
        >
          {sections.map((section, idx) => (
            <NavLink
              to={section.url}
              key={idx}
              style={{ color: "black", fontSize: "15px" }}
            >
              {section.title}
            </NavLink>
          ))}
        </Toolbar>
      </Container>
      {/* Render RecommendationButton component if modal is open */}
      {openModal && <RecommendationButton onClose={() => setOpenModal(false)} />}
    </>
  );
}

export default Header;
