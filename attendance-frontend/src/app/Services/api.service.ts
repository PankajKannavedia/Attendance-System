import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:5001/api';

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  // Attendance Actions
  punchAction(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/punch`, data);
  }

  // Personal & Admin Records
  getPersonalRecords(employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/records/personal/${employeeId}`);
  }

  getAllEmployeeRecords(): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/records/admin/today`);
  }

  getMonthlyRecords(year: string, month: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/records/admin/monthly?year=${year}&month=${month}`);
  }

  // Leave Applications
  getLeaveApplications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/leave/full`);
  }

  getPersonalLeaveApplications(employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/leave/full/personal/${employeeId}`);
  }

  applyLeave(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/data/leave/full`, payload);
  }

  approveLeave(id: string, payload: { status: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/data/leave/full/${id}`, payload);
  }

  // Early Leaves
  getEarlyLeaveApplications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/leave/early`);
  }

  getPersonalEarlyLeaveApplications(employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/leave/early/personal/${employeeId}`);
  }

  applyEarlyLeave(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/data/leave/early`, payload);
  }

  approveEarlyLeave(id: string, payload: { status: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/data/leave/early/${id}`, payload);
  }

  // Salary & Employees
  getEmployeeList(): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/employees`);
  }

  getSalaryDetails(employeeId: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/salary/${employeeId}?startDate=${startDate}&endDate=${endDate}`);
  }

  getAllSalaries(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/salary/all?startDate=${startDate}&endDate=${endDate}`);
  }

  approveOvertime(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/data/overtime`, payload);
  }

  get30DaySummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/data/records/summary/30-days`);
  }
}
