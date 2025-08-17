import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaChartPie, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [summaryRes, alertsRes, expensesRes] = await Promise.all([
        axios.get('/api/analytics/summary'),
        axios.get('/api/budget/alerts'),
        axios.get('/api/expenses?limit=5')
      ]);

      setSummary(summaryRes.data.data);
      setBudgetAlerts(alertsRes.data.data.alerts || []);
      setRecentExpenses(expensesRes.data.data.expenses || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': 'danger',
      'Transportation': 'primary',
      'Shopping': 'purple',
      'Entertainment': 'warning',
      'Healthcare': 'success',
      'Education': 'info',
      'Housing': 'success',
      'Utilities': 'warning',
      'Insurance': 'pink',
      'Travel': 'indigo',
      'Other': 'secondary'
    };
    return colors[category] || 'secondary';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="text-gradient fw-bold mb-2">Welcome back!</h1>
          <p className="text-muted">Here's an overview of your financial status</p>
        </Col>
      </Row>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Row className="mb-4">
          <Col>
            {budgetAlerts.map((alert, index) => (
              <Alert key={index} variant={alert.type === 'danger' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'} className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2" />
                <div>
                  <strong>Budget Alert:</strong> {alert.message}
                </div>
              </Alert>
            ))}
          </Col>
        </Row>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col xs={12} md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <div className="stat-value text-primary">
              {summary ? formatCurrency(summary.currentMonth.spent) : '$0.00'}
            </div>
            <div className="stat-label">Spent This Month</div>
          </Card>
        </Col>
        
        <Col xs={12} md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <div className="stat-value text-success">
              {summary ? formatCurrency(summary.currentMonth.budget) : '$0.00'}
            </div>
            <div className="stat-label">Monthly Budget</div>
          </Card>
        </Col>
        
        <Col xs={12} md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <div className="stat-value text-info">
              {summary ? summary.currentMonth.transactions : 0}
            </div>
            <div className="stat-label">Transactions</div>
          </Card>
        </Col>
        
        <Col xs={12} md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <div className="stat-value text-warning">
              {summary ? formatCurrency(summary.currentMonth.remaining) : '$0.00'}
            </div>
            <div className="stat-label">Remaining</div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <Button as={Link} to="/add-expense" variant="primary" className="d-flex align-items-center gap-2">
                  <FaPlus />
                  Add Expense
                </Button>
                <Button as={Link} to="/set-budget" variant="outline-primary" className="d-flex align-items-center gap-2">
                  <FaDollarSign />
                  Set Budget
                </Button>
                <Button as={Link} to="/analytics" variant="outline-info" className="d-flex align-items-center gap-2">
                  <FaChartPie />
                  View Analytics
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Expenses */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Expenses</h5>
              <Button as={Link} to="/expenses" variant="outline-primary" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentExpenses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentExpenses.map((expense) => (
                        <tr key={expense._id}>
                          <td>
                            <Badge bg={getCategoryColor(expense.category)}>
                              {expense.category}
                            </Badge>
                          </td>
                          <td className="fw-bold">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td>
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </td>
                          <td>
                            {expense.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">No expenses yet</p>
                  <Button as={Link} to="/add-expense" variant="primary">
                    Add Your First Expense
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Categories */}
      {summary && summary.topCategories && summary.topCategories.length > 0 && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Top Spending Categories This Month</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-3">
                  {summary.topCategories.map((category, index) => (
                    <div key={index} className="d-flex align-items-center gap-2">
                      <Badge bg={getCategoryColor(category._id)}>
                        {category._id}
                      </Badge>
                      <span className="fw-semibold">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Dashboard;
