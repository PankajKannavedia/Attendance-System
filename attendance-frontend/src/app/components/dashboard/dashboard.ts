import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../Services/api.service';
import { Router } from '@angular/router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  activeTab: string = 'attendance'; // Set Attendance as default tab
  activePayrollSubTab: string = 'personal'; // 'personal' or 'admin'
  user: any = null;
  latitude: number | null = null;
  longitude: number | null = null;
  // Camera Modal Logic
  actionToPerform: 'In' | 'Out' | null = null;
  cameraStream: MediaStream | null = null;
  showNativeCameraFallback: boolean = false;
  cameraErrorMsg: string | null = null;
  imageBase64: string | null = null;

  // Loading & Error States
  statusMessage: string = '';
  isError: boolean = false;
  isLoading: boolean = false; // For Punch actions
  private activeRequests: number = 0;
  get isDataLoading(): boolean { return this.activeRequests > 0; }

  private startLoading() {
    this.activeRequests++;
    this.cdr.detectChanges();
  }

  private stopLoading() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.cdr.detectChanges();
  }

  // Punch history variables
  punchInTime: string = '--:--';
  punchOutTime: string = '--:--';

  // Data arrays for tabs
  personalRecords: any[] = [];
  adminRecords: any[] = [];
  leaveApplications: any[] = [];
  earlyLeaveApplications: any[] = [];

  // Monthly Admin Records State
  selectedMonth: string = new Date().toISOString().substring(0, 7); // Default YYYY-MM
  monthlyRecords: any[] = [];
  isMonthlyView: boolean = false;

  // Grid State
  gridSummary: any = null;

  // Payslip State
  payslipForm = {
    startDate: '',
    endDate: ''
  };
  payslipData: any = null;

  salaryForm = {
    employeeId: 'all',
    startDate: '',
    endDate: ''
  };
  salaryResults: any | null = null;
  allSalariesResults: any[] | null = null;
  isAllSalariesMode: boolean = false;
  employeeList: any[] = [];

  // Overtime Modal State
  selectedRecordForOvertime: any = null;
  overtimeStatusForModal: boolean = false;

  personalLeaves: any[] = [];
  personalEarlyLeaves: any[] = [];
  leaveDurationType: 'Full' | 'Early' = 'Full';
  
  // Pending Counts for Admin Badges
  pendingLeaveCount: number = 0;
  pendingEarlyLeaveCount: number = 0;

  // New UI State for consolidation
  activeAdminSubTab: 'full' | 'early' = 'full';
  isProcessing: boolean = false;
  toast = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  };

  pendingApprovalData: { id: string, status: string, type: 'full' | 'early' } | null = null;

  get totalPendingCount(): number {
    return this.pendingLeaveCount + this.pendingEarlyLeaveCount;
  }

  constructor(
    private api: ApiService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      this.loadPersonalRecords(); // Load initial state on entry
      
      // If admin, also preload approval counts for badges
      if(this.isAdmin()) {
        this.loadLeaveApplications();
        this.loadEarlyLeaveApplications();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Handle Tab Switching & Fresh Data Polling
  switchTab(tab: string): void {
    this.activeTab = tab;
    
    if (tab === 'attendance') {
       this.loadPersonalRecords();
    } else if (tab === 'leaves') {
       this.loadPersonalLeaveApplications();
       this.loadPersonalEarlyLeaveApplications();
       if (this.isAdmin()) {
         this.loadLeaveApplications();
         this.loadEarlyLeaveApplications();
       }
    } else if (tab === 'payroll') {
       if (this.isAdmin()) {
         this.loadEmployeeList();
       }
       // Payslip data is loaded on demand/view, but we can clear old results
       this.payslipData = null;
    } else if (tab === 'admin-hub') {
       if (this.isAdmin()) {
         this.loadAdminRecords();
         this.load30DaySummary();
       }
    }
    
    this.cdr.detectChanges();
  }

  isAdmin(): boolean {
    return this.user?.role?.toLowerCase() === 'admin';
  }

  // Formatting utilities ported from GAS
  formatTimeToAMPM(timeStr: string): string {
    if (!timeStr || timeStr === '--:--' || !timeStr.includes(':')) return timeStr;
    try {
      let [hoursStr, minutesStr] = timeStr.split(':');
      let h = parseInt(hoursStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${minutesStr} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  }

  // ==========================================
  // DATA LOADING METHODS
  // ==========================================

  loadPersonalRecords() {
    this.startLoading();
    this.api.getPersonalRecords(this.user.employeeId).subscribe({
      next: (records: any[]) => {
        this.personalRecords = records;
        
        // Update punch status based on today's records
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRec = records.find(r => r.dateString === todayStr);

        if (todayRec) {
          this.punchInTime = todayRec.inTime ? this.formatTimeToAMPM(todayRec.inTime) : '--:--';
          this.punchOutTime = todayRec.outTime ? this.formatTimeToAMPM(todayRec.outTime) : '--:--';
        }
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error("Error loading personal records", err);
      }
    });
  }

  loadAdminRecords() {
    if(!this.isAdmin()) return;
    this.isMonthlyView = false;
    this.startLoading();
    this.api.getAllEmployeeRecords().subscribe({
      next: (records) => {
        this.adminRecords = records;
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error("Error loading admin records", err);
      }
    });
  }

  loadMonthlyRecords() {
    if (!this.isAdmin() || !this.selectedMonth) return;
    const [year, month] = this.selectedMonth.split('-');
    this.isMonthlyView = true;
    this.startLoading();
    
    this.api.getMonthlyRecords(year, month).subscribe({
      next: (records) => {
        this.monthlyRecords = records;
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error("Error loading monthly records", err);
      }
    });
  }

  downloadExcel() {
    if (!this.monthlyRecords || this.monthlyRecords.length === 0) {
      alert("No data available to export for the selected month.");
      return;
    }

    const exportData = this.monthlyRecords.map(rec => ({
      "Employee ID": rec.employeeId,
      "Name": rec.name,
      "Date": rec.dateString,
      "In Time": this.formatTimeToAMPM(rec.inTime),
      "Out Time": this.formatTimeToAMPM(rec.outTime),
      "In Location": rec.inLocation,
      "Out Location": rec.outLocation,
      "Total Hours": rec.totalHours,
      "Day Status": rec.dayStatus,
      "Overtime Status": rec.overtimePermit
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_${this.selectedMonth}.xlsx`);
  }

  load30DaySummary() {
    this.startLoading();
    this.api.get30DaySummary().subscribe({
      next: (data) => {
        // Reverse dates to show oldest first or newest first based on preference.
        // It's sent newest to oldest from backend. Optional: reverse it if needed.
        data.dates.reverse();
        this.gridSummary = data;
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error("Error loading 30 day grid", err);
      }
    });
  }

  loadLeaveApplications() {
    this.startLoading();
    this.api.getLeaveApplications().subscribe({
      next: (apps) => {
        const pending = apps.filter((a: any) => a.status === 'Pending');
        this.leaveApplications = pending;
        this.pendingLeaveCount = pending.length;
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error(err);
      }
    });
  }

  loadPersonalLeaveApplications() {
    this.api.getPersonalLeaveApplications(this.user.employeeId).subscribe({
      next: (apps) => {
        this.personalLeaves = apps;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadEarlyLeaveApplications() {
    this.startLoading();
    this.api.getEarlyLeaveApplications().subscribe({
      next: (apps) => {
        const pending = apps.filter((a: any) => a.status === 'Pending');
        this.earlyLeaveApplications = pending;
        this.pendingEarlyLeaveCount = pending.length;
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error(err);
      }
    });
  }

  loadPersonalEarlyLeaveApplications() {
    this.api.getPersonalEarlyLeaveApplications(this.user.employeeId).subscribe({
      next: (apps) => {
        this.personalEarlyLeaves = apps;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  // ==========================================
  // PUNCH LOGIC
  // ==========================================
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageBase64 = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  handlePunch(action: 'In' | 'Out'): void {
    if (!this.imageBase64) {
      this.showMessage('Please capture or upload a photo first.', true);
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Getting location...';
    this.isError = false;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.submitPunch(action);
        },
        (error) => {
          this.showMessage('Error getting location. Please enable location services.', true);
          this.isLoading = false;
        }
      );
    } else {
      this.showMessage('Geolocation is not supported by this browser.', true);
      this.isLoading = false;
    }
  }

  private submitPunch(action: 'In' | 'Out'): void {
    this.statusMessage = `Punching ${action}...`;
    
    const payload = {
      employeeId: this.user.employeeId,
      name: this.user.name,
      action: action,
      latitude: this.latitude,
      longitude: this.longitude,
      imageBase64: this.imageBase64
    };

    this.api.punchAction(payload).subscribe({
      next: (res) => {
        this.showMessage(`Successfully Punched ${action}!`, false);
        this.closePunchModal();
        this.isLoading = false;
        this.imageBase64 = null;
        
        const timeNow = new Date();
        const strTime = this.formatTimeToAMPM(`${timeNow.getHours()}:${timeNow.getMinutes()}`);
        if(action === 'In') this.punchInTime = strTime;
        if(action === 'Out') this.punchOutTime = strTime;

        const fileInput = document.getElementById('photoInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.loadPersonalRecords(); // refresh records
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Failed to punch. Server error.', true);
        this.isLoading = false;
      }
    });
  }

  // ==========================================
  // CAMERA MODAL LOGIC
  // ==========================================

  openPunchModal(action: 'In' | 'Out') {
    this.actionToPerform = action;
    this.imageBase64 = null;
    this.showNativeCameraFallback = false;
    this.cameraErrorMsg = null;
    this.isLoading = false;
    this.statusMessage = '';
    this.isError = false;

    this.openGenericModal('cameraModal');
    
    // Start camera
    this.startCamera();
  }

  closePunchModal() {
    this.stopCamera();
    this.actionToPerform = null;
    this.imageBase64 = null;
    this.closeGenericModal('cameraModal');
  }

  startCamera() {
    this.showNativeCameraFallback = false;
    this.cameraErrorMsg = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          this.cameraStream = stream;
          // Ensure angular has updated the DOM before querying the video element
          setTimeout(() => {
            const videoElement = document.getElementById('camera-video') as HTMLVideoElement;
            if (videoElement) {
              videoElement.srcObject = stream;
              videoElement.play().catch(e => console.error("Video play error:", e));
            }
          }, 100);
        })
        .catch(err => {
          console.error("Camera error:", err);
          this.showNativeCameraFallback = true;
          this.cameraErrorMsg = "Live camera unavailable. Please use the fallback option below.";
        });
    } else {
      this.showNativeCameraFallback = true;
      this.cameraErrorMsg = "Camera API not supported in this browser. Please use the fallback option below.";
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  }

  capturePhoto() {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.imageBase64 = canvas.toDataURL('image/jpeg');
        this.stopCamera(); // stop the stream since we have the photo
      }
    }
  }

  retakePhoto() {
    this.imageBase64 = null;
    this.startCamera();
  }

  confirmPunch() {
    if (!this.actionToPerform) return;
    if (!this.imageBase64) {
      this.showMessage("Please capture or upload a photo first.", true);
      return;
    }
    this.handlePunch(this.actionToPerform);
  }

  // Modal Helpers
  openGenericModal(id: string) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = `${id}-backdrop`;
      document.body.appendChild(backdrop);
    }
  }

  closeGenericModal(id: string) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.getElementById(`${id}-backdrop`);
      if (backdrop) backdrop.remove();
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  private showMessage(msg: string, isErr: boolean): void {
    this.statusMessage = msg;
    this.isError = isErr;
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 4000);
    this.cdr.detectChanges();
  }

  updateLeaveStatus(applicationId: string, status: string) {
    this.pendingApprovalData = { id: applicationId, status, type: 'full' };
    this.openGenericModal('confirmActionModal');
  }

  confirmApprovalAction() {
    if (!this.pendingApprovalData) return;
    const { id, status, type } = this.pendingApprovalData;
    this.closeGenericModal('confirmActionModal');

    this.isProcessing = true;
    if (type === 'full') {
      this.api.approveLeave(id, { status }).subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.showToast(`Leave application ${status.toLowerCase()} successfully`, 'success');
          this.leaveApplications = this.leaveApplications.filter(a => a.applicationId !== id);
          this.pendingLeaveCount = this.leaveApplications.length;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isProcessing = false;
          this.showToast(`Failed to update status: ${err.error?.message || err.message}`, 'error');
        }
      });
    } else {
      this.api.approveEarlyLeave(id, { status }).subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.showToast("Early leave updated successfully!", 'success');
          this.earlyLeaveApplications = this.earlyLeaveApplications.filter(a => a.applicationId !== id);
          this.pendingEarlyLeaveCount = this.earlyLeaveApplications.length;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isProcessing = false;
          this.showToast("Failed to update status", 'error');
        }
      });
    }
  }



  // ==========================================
  // LEAVE LOGIC (FULL & EARLY)
  // ==========================================
  
  leaveForm = {
    leaveType: 'Sick',
    fromDate: '',
    toDate: '',
    reason: ''
  };

  earlyLeaveForm = {
    date: '',
    hours: 1,
    reason: ''
  };

  submitLeave() {
    if (this.leaveDurationType === 'Full') {
      if(!this.leaveForm.fromDate || !this.leaveForm.toDate || !this.leaveForm.reason) {
        this.showToast("Please fill all fields.", 'error');
        return;
      }
      const from = new Date(this.leaveForm.fromDate);
      const to = new Date(this.leaveForm.toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const payload = {
        employeeId: this.user.employeeId,
        employeeName: this.user.name,
        department: "General",
        leaveType: this.leaveForm.leaveType,
        fromDate: this.leaveForm.fromDate,
        toDate: this.leaveForm.toDate,
        totalDays,
        reason: this.leaveForm.reason
      };

      this.isProcessing = true;
      this.api.applyLeave(payload).subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.showToast(res.message, 'success');
          Promise.resolve().then(() => {
            this.leaveForm = { leaveType: 'Sick', fromDate: '', toDate: '', reason: '' };
            this.cdr.detectChanges();
          });
          this.closeGenericModal('fullLeaveModal');
          this.loadPersonalLeaveApplications();
        },
        error: (err) => {
          this.isProcessing = false;
          console.error(err);
          this.showToast("Failed to apply leave.", 'error');
        }
      });
    } else {
      if(!this.earlyLeaveForm.date || !this.earlyLeaveForm.reason) {
        this.showToast("Please fill all required early leave fields.", 'error');
        return;
      }
  
      const payload = {
        employeeId: this.user.employeeId,
        employeeName: this.user.name,
        leaveDate: this.earlyLeaveForm.date,
        hoursRequested: this.earlyLeaveForm.hours,
        reason: this.earlyLeaveForm.reason
      };
  
      this.isProcessing = true;
      this.api.applyEarlyLeave(payload).subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.showToast("Early Leave applied successfully!", 'success');
          Promise.resolve().then(() => {
            this.earlyLeaveForm = { date: '', hours: 1, reason: '' };
            this.cdr.detectChanges();
          });
          this.closeGenericModal('earlyLeaveModal');
          this.loadPersonalEarlyLeaveApplications();
        },
        error: (err) => {
          this.isProcessing = false;
          this.showToast("Error applying early leave.", 'error');
        }
      });
    }
  }

  submitEarlyLeave() {
    this.leaveDurationType = 'Early';
    this.submitLeave();
  }

  updateEarlyLeaveStatus(applicationId: string, status: string) {
    this.pendingApprovalData = { id: applicationId, status, type: 'early' };
    this.openGenericModal('confirmActionModal');
  }


  // ==========================================
  // SALARY & EMPLOYEES LOGIC
  // ==========================================

  loadEmployeeList() {
    if(!this.isAdmin()) return;
    this.startLoading();
    this.api.getEmployeeList().subscribe({
      next: (emps) => {
        this.employeeList = emps;
        this.stopLoading();
      },
      error: (err) => {
        this.stopLoading();
        console.error("Error loading employee list", err);
      }
    });
  }

  calculateSalary() {
    if(!this.salaryForm.employeeId || !this.salaryForm.startDate || !this.salaryForm.endDate) {
      alert("Please select an employee and date range");
      return;
    }

    if (this.salaryForm.employeeId === 'all') {
      this.isAllSalariesMode = true;
      this.api.getAllSalaries(this.salaryForm.startDate, this.salaryForm.endDate).subscribe({
        next: (data) => {
          this.allSalariesResults = data;
          this.stopLoading();
        },
        error: (err) => {
          this.stopLoading();
          alert("Error calculating summaries");
          console.error(err);
        }
      });
    } else {
      this.isAllSalariesMode = false;
      this.api.getSalaryDetails(this.salaryForm.employeeId, this.salaryForm.startDate, this.salaryForm.endDate)
        .subscribe({
          next: (data) => {
            this.salaryResults = data;
            this.stopLoading();
          },
          error: (err) => {
            this.stopLoading();
            alert("Error calculating salary");
            console.error(err);
          }
        });
    }
  }

  clearAdminSalaryFilters() {
    this.salaryForm = {
      employeeId: '',
      startDate: '',
      endDate: ''
    };
    this.salaryResults = null;
    this.allSalariesResults = null;
    this.isAllSalariesMode = false;
  }

  // ==========================================
  // PAYSLIP LOGIC
  // ==========================================
  
  viewPayslip() {
    if(!this.payslipForm.startDate || !this.payslipForm.endDate) {
      alert("Please select a date range");
      return;
    }

    this.startLoading();
    this.api.getSalaryDetails(this.user.employeeId, this.payslipForm.startDate, this.payslipForm.endDate)
      .subscribe({
        next: (data) => {
          this.payslipData = data;
          this.stopLoading();
        },
        error: (err) => {
          this.stopLoading();
          alert("Error generating payslip data");
          console.error(err);
        }
      });
  }

  clearPayrollFilters() {
    this.payslipForm = {
      startDate: '',
      endDate: ''
    };
    this.payslipData = null;
  }

  currentDisplayDate() {
    return new Date().toLocaleDateString();
  }

  downloadPayslipPDF() {
    const data = document.getElementById('payslip-container');
    if (data) {
      // Small timeout to ensure Angular rendering is complete
      setTimeout(() => {
        html2canvas(data, { scale: 2 }).then(canvas => {
          const imgWidth = 208;
          const pageHeight = 295;
          const imgHeight = canvas.height * imgWidth / canvas.width;
          let heightLeft = imgHeight;

          const contentDataURL = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const position = 10;
          pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
          pdf.save(`Payslip_${this.user.name}_${this.payslipForm.startDate}.pdf`);
        }).catch(err => {
          alert("Error generating PDF");
          console.error(err);
        });
      }, 100);
    }
  }

  formatCurrency(amount: string | number): string {
    if (!amount || amount === '₹0' || amount === 0) return '₹0';
    try {
      const cleanAmount = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^0-9.]/g, ''))
        : amount;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(cleanAmount);
    } catch (e) {
      return amount.toString();
    }
  }

  // ==========================================
  // OVERTIME LOGIC
  // ==========================================
  
  openOvertimeModal(record: any) {
    this.selectedRecordForOvertime = record;
    this.overtimeStatusForModal = (record.overtimePermit === 'Approved');
    
    const modal = document.getElementById('overtimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'overtime-backdrop';
      document.body.appendChild(backdrop);
    }
  }

  closeOvertimeModal() {
    this.selectedRecordForOvertime = null;
    const modal = document.getElementById('overtimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.getElementById('overtime-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  submitOvertime() {
    if (!this.selectedRecordForOvertime) return;
    
    const statusStr = this.overtimeStatusForModal ? 'Approved' : 'Not Approved';
    const payload = {
      employeeId: this.selectedRecordForOvertime.employeeId,
      otDate: new Date().toISOString().split('T')[0],
      approved: statusStr
    };

    this.api.approveOvertime(payload).subscribe({
      next: (res) => {
        this.selectedRecordForOvertime.overtimePermit = statusStr;
        alert('Overtime status updated successfully.');
        this.closeOvertimeModal();
        this.loadAdminRecords();
      },
      error: (err) => {
        alert('Failed to update overtime.');
        console.error(err);
      }
    });
  }
}


