// main-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { NgClass } from '@angular/common';
import { SidenavService } from './services/sidenav.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidenavComponent],
  template: `
    <div class="main-container">
      <app-sidenav (onToggleSideNav)="onToggleSideNav($event)"></app-sidenav>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .main-container {
      min-height: 100vh;
      width: 100%;
      background-color: #F2F3F7;
      position: relative;
    }
    
    .content {
      min-height: 100vh;
      background-color: transparent;
      padding: 0;
    }
    
    @media (max-width: 768px) {
      .content {
        margin-left: 0;
      }
    }
  `]
})
export class MainLayoutComponent {
  isSideNavCollapsed = false;
  screenWidth = 0;
  
  constructor(private sidenavService: SidenavService) {
    // Suscribirse al estado del sidebar
    this.sidenavService.isCollapsed$.subscribe(collapsed => {
      this.isSideNavCollapsed = collapsed;
    });
  }
  
  onToggleSideNav(data: {screenWidth: number, collapsed: boolean}): void {
    this.screenWidth = data.screenWidth;
    this.isSideNavCollapsed = data.collapsed;
  }
}