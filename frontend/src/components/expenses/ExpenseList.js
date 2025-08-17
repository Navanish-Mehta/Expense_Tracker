import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Pagination, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    month: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Education',
    'Housing',
    'Utilities',
    'Insurance',
    'Travel',
    'Other'
  ];

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await axios.get('/api/expenses', { params });
      const { expenses, pagination: paginationData } = response.data.data;
      
      setExpenses(expenses);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

   useEffect(() => {
  fetchExpenses();
}, [fetchExpenses]);


  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleDelete = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/expenses/${expenseToDelete._id}`);
      toast.success('Expense deleted successfully');
      // Refresh expenses data
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await axios.get('/api/expenses', { params });
      const { expenses: newExpenses, pagination: paginationData } = response.data.data;
      
      setExpenses(newExpenses);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense({ ...expense });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/expenses/${editingExpense._id}`, {
        category: editingExpense.category,
        amount: parseFloat(editingExpense.amount),
        date: editingExpense.date,
        description: editingExpense.description
      });
      
      toast.success('Expense updated successfully');
      // Refresh expenses data
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await axios.get('/api/expenses', { params });
      const { expenses: newExpenses, pagination: paginationData } = response.data.data;
      
      setExpenses(newExpenses);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
      setShowEditModal(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

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

  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMMM yyyy');
      months.push({ value: monthStr, label: monthLabel });
    }
    
    return months;
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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-gradient fw-bold mb-2">Expenses</h1>
              <p className="text-muted">Manage and track your expenses</p>
            </div>
            <Button as={Link} to="/add-expense" variant="primary" className="d-flex align-items-center gap-2">
              <FaPlus />
              Add Expense
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h6 className="card-title mb-3">
                <FaFilter className="me-2" />
                Filters
              </h6>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Month</Form.Label>
                    <Form.Select
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                    >
                      <option value="">All Months</option>
                      {generateMonthOptions().map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Search Description</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search in descriptions..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Expenses Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Expense List</h5>
                <span className="text-muted">
                  {pagination.totalItems} expenses found
                </span>
              </div>
            </Card.Header>
            <Card.Body>
              {expenses.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <Table className="table-hover">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((expense) => (
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
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleEdit(expense)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDelete(expense)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.currentPage === 1}
                        />
                        <Pagination.Prev
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                        />
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === pagination.totalPages || 
                            Math.abs(page - pagination.currentPage) <= 2
                          )
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <Pagination.Ellipsis />
                              )}
                              <Pagination.Item
                                active={page === pagination.currentPage}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Pagination.Item>
                            </React.Fragment>
                          ))}
                        
                        <Pagination.Next
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                        />
                        <Pagination.Last
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.currentPage === pagination.totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-3">No expenses found</p>
                  <Button as={Link} to="/add-expense" variant="primary">
                    Add Your First Expense
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this expense?
          <br />
          <strong>{expenseToDelete?.category} - {expenseToDelete && formatCurrency(expenseToDelete.amount)}</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingExpense && (
            <Form onSubmit={handleEditSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={editingExpense.category}
                      onChange={(e) => setEditingExpense(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense(prev => ({
                        ...prev,
                        amount: e.target.value
                      }))}
                      step="0.01"
                      min="0.01"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editingExpense.date}
                      onChange={(e) => setEditingExpense(prev => ({
                        ...prev,
                        date: e.target.value
                      }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      value={editingExpense.description || ''}
                      onChange={(e) => setEditingExpense(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      rows="1"
                      maxLength="200"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-end">
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Update Expense
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ExpenseList;
