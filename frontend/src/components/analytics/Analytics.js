import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { FaChartPie, FaChartBar, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    summary: null,
    category: null,
    monthly: null,
    trends: null
  });



  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      const [summaryRes, categoryRes, monthlyRes, trendsRes] = await Promise.all([
        axios.get('/api/analytics/summary'),
        axios.get(`/api/analytics/category?${filters.month ? `month=${filters.month}` : `year=${filters.year}`}`),
        axios.get(`/api/analytics/monthly?year=${filters.year}`),
        axios.get('/api/analytics/trends?period=monthly&months=12')
      ]);

      setAnalyticsData({
        summary: summaryRes.data.data,
        category: categoryRes.data.data,
        monthly: monthlyRes.data.data,
        trends: trendsRes.data.data
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };



  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': '#FF6B6B',
      'Transportation': '#4ECDC4',
      'Shopping': '#45B7D1',
      'Entertainment': '#96CEB4',
      'Healthcare': '#FFEAA7',
      'Education': '#DDA0DD',
      'Housing': '#98D8C8',
      'Utilities': '#F7DC6F',
      'Insurance': '#BB8FCE',
      'Travel': '#85C1E9',
      'Other': '#AEB6BF'
    };
    return colors[category] || '#AEB6BF';
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
          <h1 className="text-gradient fw-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted">Visualize your spending patterns and trends</p>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex align-items-center gap-3">
                <FaCalendarAlt className="text-muted" />
                <Form.Group className="mb-0">
                  <Form.Label className="mb-0 me-2">Month:</Form.Label>
                  <Form.Control
                    type="month"
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    style={{ width: 'auto' }}
                  />
                </Form.Group>
                <span className="text-muted">or</span>
                <Form.Group className="mb-0">
                  <Form.Label className="mb-0 me-2">Year:</Form.Label>
                  <Form.Control
                    type="number"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    min="2020"
                    max="2030"
                    style={{ width: '100px' }}
                  />
                </Form.Group>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      month: '',
                      year: new Date().getFullYear()
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('overview')}
              className="d-flex align-items-center gap-2"
            >
              <FaChartPie />
              Overview
            </Button>
            <Button
              variant={activeTab === 'category' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('category')}
              className="d-flex align-items-center gap-2"
            >
              <FaChartPie />
              Category Breakdown
            </Button>
            <Button
              variant={activeTab === 'monthly' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('monthly')}
              className="d-flex align-items-center gap-2"
            >
              <FaChartBar />
              Monthly Trends
            </Button>
            <Button
              variant={activeTab === 'trends' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('trends')}
              className="d-flex align-items-center gap-2"
            >
              <FaChartLine />
              Spending Trends
            </Button>
          </div>
        </Col>
      </Row>

      {/* Overview Tab */}
      {activeTab === 'overview' && analyticsData.summary && (
        <Row>
          <Col>
            <Card className="shadow">
              <Card.Header>
                <h5 className="mb-0">Spending Overview</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Current Month Summary</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Spent:</span>
                      <strong className="text-primary">
                        {formatCurrency(analyticsData.summary.currentMonth.spent)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Budget Limit:</span>
                      <strong className="text-success">
                        {formatCurrency(analyticsData.summary.currentMonth.budget)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Remaining:</span>
                      <strong className="text-warning">
                        {formatCurrency(analyticsData.summary.currentMonth.remaining)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Transactions:</span>
                      <strong>{analyticsData.summary.currentMonth.transactions}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <h6>Month-over-Month Comparison</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Previous Month:</span>
                      <strong>{formatCurrency(analyticsData.summary.comparison.previousMonth)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Change:</span>
                      <strong className={analyticsData.summary.comparison.changeAmount >= 0 ? 'text-danger' : 'text-success'}>
                        {analyticsData.summary.comparison.changeAmount >= 0 ? '+' : ''}
                        {formatCurrency(analyticsData.summary.comparison.changeAmount)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Percentage:</span>
                      <strong className={analyticsData.summary.comparison.changePercentage >= 0 ? 'text-danger' : 'text-success'}>
                        {analyticsData.summary.comparison.changePercentage >= 0 ? '+' : ''}
                        {analyticsData.summary.comparison.changePercentage}%
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Trend:</span>
                      <Badge bg={analyticsData.summary.comparison.trend === 'increase' ? 'danger' : analyticsData.summary.comparison.trend === 'decrease' ? 'success' : 'secondary'}>
                        {analyticsData.summary.comparison.trend}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Category Breakdown Tab */}
      {activeTab === 'category' && analyticsData.category && (
        <Row>
          <Col lg={8}>
            <Card className="shadow">
              <Card.Header>
                <h5 className="mb-0">Category Breakdown - {analyticsData.category.timePeriod}</h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analyticsData.category.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {analyticsData.category.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow">
              <Card.Header>
                <h6 className="mb-0">Category Details</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6>Total Spent: {formatCurrency(analyticsData.category.totalSpent)}</h6>
                  <p className="text-muted mb-0">Total Transactions: {analyticsData.category.totalTransactions}</p>
                </div>
                <div className="d-flex flex-column gap-2">
                  {analyticsData.category.categoryBreakdown.map((category, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center p-2 border rounded">
                      <div>
                        <div className="fw-semibold">{category.category}</div>
                        <small className="text-muted">{category.count} transactions</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{formatCurrency(category.amount)}</div>
                        <small className="text-muted">{category.percentage}%</small>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Monthly Trends Tab */}
      {activeTab === 'monthly' && analyticsData.monthly && (
        <Row>
          <Col>
            <Card className="shadow">
              <Card.Header>
                <h5 className="mb-0">Monthly Spending Trends - {analyticsData.monthly.year}</h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.monthly.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="spent" fill="#8884d8" name="Spent" />
                    <Bar dataKey="budget" fill="#82ca9d" name="Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Spending Trends Tab */}
      {activeTab === 'trends' && analyticsData.trends && (
        <Row>
          <Col>
            <Card className="shadow">
              <Card.Header>
                <h5 className="mb-0">Spending Trends - Last 12 Months</h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.trends.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="spent" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="row text-center mt-4">
                  <div className="col-md-6">
                    <h6>Total Spent</h6>
                    <p className="text-primary fw-bold fs-4">
                      {formatCurrency(analyticsData.trends.totalSpent)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Average Monthly</h6>
                    <p className="text-success fw-bold fs-4">
                      {formatCurrency(analyticsData.trends.averageSpent)}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Analytics;
