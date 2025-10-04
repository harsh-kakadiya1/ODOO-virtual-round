# Expense Management System

A modern, role-based Expense Management platform designed for companies to automate and streamline expense reimbursement processes, enabling multi-level approvals, flexible workflow rules, and OCR-powered receipt scanning. Built for hackathon and real-world adoption.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles & Permissions](#user-roles--permissions)
- [Approval Workflow](#approval-workflow)
- [Receipt OCR Functionality](#receipt-ocr-functionality)
- [API Integrations](#api-integrations)
- [Screens & User Experience](#screens--user-experience)
- [Setup & Installation](#setup--installation)
- [References](#references)

---

## Overview

This repository implements a comprehensive solution for the Odoo Hackathon Expense Management challenge. The system digitizes expense claims, approval, and tracking — reducing manual effort, increasing transparency, and supporting flexible, threshold-based approval flows.

---

## Features

- Company creation on signup with country and currency detection
- Admin auto-onboarding as first user
- Employee/Manager creation and assignment
- Dynamic role management: Employee, Manager, Admin
- Expense submission (amount, currency, category, description, date)
- Personal expense history and status (approved/rejected)
- Role-based dashboards and actionable workflow
- Secure, responsive authentication for all roles

---

## User Roles & Permissions

| Role      | Permissions                                                                              |
|-----------|-----------------------------------------------------------------------------------------|
| Admin     | Create companies, manage users/roles, configure approval rules, view all expenses, override decisions |
| Manager   | Approve/reject team expenses, view team submissions, escalate per approval policy        |
| Employee  | Submit expense claims, view own expense history/status, scan receipts                    |

---

## Approval Workflow

- Expenses are routed to assigned manager (if "Is Manager Approver" is enabled)
- Multi-level approval: sequential workflow (Manager → Finance → Director, etc.)
- Conditional rules:
  - **Percentage:** approve if X% approvers accept
  - **Specific approver:** auto-approve if key role (e.g. CFO) accepts
  - **Hybrid:** percentage or key role approval
  - Support both flows in combination
- Approvers leave comments, view pending claims, escalate as needed

---

## Receipt OCR Functionality

- Employees scan receipts for automated reading
- Receipt fields are auto-populated: Amount, Date, Description, Expense Lines, Type, Vendor Name

---

## API Integrations

- Country/currency data: [restcountries.com](https://restcountries.com/v3.1/all?fields=name,currencies)
- Currency conversion: [exchangerate-api.com](https://api.exchangerate-api.com/v4/latest/BASE_CURRENCY)

---

## Screens & User Experience

- Dashboard for each distinct role
- Responsive, mobile-first layout
- Guided submission, approval, review flows
- Track history and approval status effortlessly

---
