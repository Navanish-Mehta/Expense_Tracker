import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SetBudget = () => {
  const [budget, setBudget] = useState(null);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [formData, setFormData] = useState({
    month: '',
    limit: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [currentBudgetRes, historyRes] = await Promise.all([
        axios.get('/api/budget'),
        axios.get('/api/budget/history')
      ]);

      setBudget(currentBudgetRes.data.data);
      setBudgetHistory(historyRes.data.data.budgetHistory);
      
      // Set current month as default for form
      const currentMonth = new Date().toISOString().slice(0, 7);
      setFormData(prev => ({
        ...prev,
        month: currentMonth
      }));
    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.month || !formData.limit) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (parseFloat(formData.limit) <= 0) {
      toast.error('Budget limit must be greater than 0');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await axios.post('/api/budget', {
        month: formData.month,
        limit: parseFloat(formData.limit)
      });
      
      toast.success('Budget set successfully!');
      // Refresh budget data
      const [currentBudgetRes, historyRes] = await Promise.all([
        axios.get('/api/budget'),
        axios.get('/api/budget/history')
      ]);

      setBudget(currentBudgetRes.data.data);
      setBudgetHistory(historyRes.data.data.budgetHistory);
      
      // Reset form
      setFormData({
        month: formData.month, // Keep current month
        limit: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to set budget';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getBudgetStatus = (budget) => {
    if (!budget || budget.limit === 0) return 'info';
    
    const percentage = budget.spendingPercentage;
    if (percentage >= 90) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const getStatusText = (budget) => {
    if (!budget || budget.limit === 0) return 'No Budget Set';
    
    const percentage = budget.spendingPercentage;
    if (percentage >= 100) return 'Budget Exceeded';
    if (percentage >= 90) return 'Almost Exceeded';
    if (percentage >= 80) return 'Warning';
    return 'On Track';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy');
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
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="text-gradient fw-bold mb-2">Budget Management</h1>
          <p className="text-muted">Set and monitor your monthly spending limits</p>
        </Col>
      </Row>

      <Row>
        {/* Set Budget Form */}
        <Col lg={4} className="mb-4">
          <Card className="shadow h-100">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center gap-2">
                <FaDollarSign />
                <h5 className="mb-0">Set Monthly Budget</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Month</Form.Label>
                  <Form.Control
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Budget Limit</Form.Label>
                  <Form.Control
                    type="number"
                    name="limit"
                    value={formData.limit}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter your monthly spending limit
                  </Form.Text>
                </Form.Group>
                
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Setting Budget...
                    </>
                  ) : (
                    <>
                      <FaDollarSign className="me-2" />
                      Set Budget
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Current Budget Status */}
        <Col lg={8} className="mb-4">
          <Card className="shadow h-100">
            <Card.Header>
              <h5 className="mb-0">Current Month Budget Status</h5>
            </Card.Header>
            <Card.Body>
              {budget && budget.limit > 0 ? (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">{formatMonth(budget.month)}</h6>
                    <Badge bg={getBudgetStatus(budget)}>
                      {getStatusText(budget)}
                    </Badge>
                  </div>
                  
                  <div className="row text-center mb-3">
                    <div className="col-4">
                      <div className="text-primary fw-bold fs-4">
                        {formatCurrency(budget.limit)}
                      </div>
                      <small className="text-muted">Budget Limit</small>
                    </div>
                    <div className="col-4">
                      <div className="text-warning fw-bold fs-4">
                        {formatCurrency(budget.spent)}
                      </div>
                      <small className="text-muted">Spent</small>
                    </div>
                    <div className="col-4">
                      <div className="text-success fw-bold fs-4">
                        {formatCurrency(budget.remaining)}
                      </div>
                      <small className="text-muted">Remaining</small>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Progress</small>
                      <small className="fw-bold">{budget.spendingPercentage}%</small>
                    </div>
                    <ProgressBar
                      variant={getBudgetStatus(budget)}
                      now={Math.min(budget.spendingPercentage, 100)}
                      className="mb-2"
                    />
                  </div>
                  
                  {budget.spendingPercentage >= 80 && (
                    <Alert variant={budget.spendingPercentage >= 90 ? 'danger' : 'warning'} className="mb-0">
                      <FaExclamationTriangle className="me-2" />
                      {budget.spendingPercentage >= 100 
                        ? 'You have exceeded your budget!'
                        : 'You are approaching your budget limit. Consider reducing spending.'
                      }
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaDollarSign className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                  <p className="text-muted mb-3">No budget set for this month</p>
                  <p className="text-muted">Set a budget above to start tracking your spending</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Budget History */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header>
              <h5 className="mb-0">Budget History (Last 12 Months)</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Budget Limit</th>
                      <th>Spent</th>
                      <th>Remaining</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetHistory.map((budgetItem) => (
                      <tr key={budgetItem.month}>
                        <td>
                          <strong>{formatMonth(budgetItem.month)}</strong>
                        </td>
                        <td>
                          {budgetItem.limit > 0 ? formatCurrency(budgetItem.limit) : '-'}
                        </td>
                        <td>
                          {budgetItem.spent > 0 ? formatCurrency(budgetItem.spent) : '-'}
                        </td>
                        <td>
                          {budgetItem.remaining > 0 ? formatCurrency(budgetItem.remaining) : '-'}
                        </td>
                        <td>
                          {budgetItem.limit > 0 ? (
                            <div>
                              <div className="d-flex justify-content-between mb-1">
                                <small>{budgetItem.spendingPercentage}%</small>
                              </div>
                              <ProgressBar
                                variant={getBudgetStatus(budgetItem)}
                                now={Math.min(budgetItem.spendingPercentage, 100)}
                                style={{ height: '6px' }}
                              />
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {budgetItem.limit > 0 ? (
                            <Badge bg={getBudgetStatus(budgetItem)}>
                              {getStatusText(budgetItem)}
                            </Badge>
                          ) : (
                            <Badge bg="secondary">No Budget</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SetBudget;
