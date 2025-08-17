import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { FaChartPie, FaPlus, FaList, FaDollarSign, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaChartPie /> },
    { path: '/add-expense', label: 'Add Expense', icon: <FaPlus /> },
    { path: '/expenses', label: 'Expenses', icon: <FaList /> },
    { path: '/set-budget', label: 'Budget', icon: <FaDollarSign /> },
    { path: '/analytics', label: 'Analytics', icon: <FaChartPie /> }
  ];

  return (
    <Navbar 
      bg="white" 
      expand="lg" 
      fixed="top" 
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="text-gradient fw-bold">
          💰 Expense Tracker
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {navItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`d-flex align-items-center gap-2 ${
                  isActive(item.path) ? 'text-primary fw-semibold' : 'text-muted'
                }`}

              >
                {item.icon}
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
          
          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                <FaUser />
                {user?.name || 'User'}
              </Dropdown.Toggle>
              
              <Dropdown.Menu>
                <Dropdown.Header>
                  <div className="fw-semibold">{user?.name}</div>
                  <small className="text-muted">{user?.email}</small>
                </Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
