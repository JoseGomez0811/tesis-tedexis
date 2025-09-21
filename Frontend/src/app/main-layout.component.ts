// main-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidenavComponent, NgClass],
  template: `
    <app-sidenav (onToggleSideNav)="onToggleSideNav($event)"></app-sidenav>
    <div class="content" [ngClass]="{ 'content-collapsed': isSideNavCollapsed, 'content-expanded': !isSideNavCollapsed }">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .content {
      transition: margin-left 0.3s ease;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 1rem;
    }
    .content-collapsed {
      margin-left: 4rem; /* 64px - corresponde al ancho del sidebar colapsado */
    }
    .content-expanded {
      margin-left: 16rem; /* 256px - corresponde al ancho del sidebar expandido */
    }
    
    @media (max-width: 768px) {
      .content-collapsed {
        margin-left: 4rem;
      }
      .content-expanded {
        margin-left: 0;
      }
    }
  `]
})
export class MainLayoutComponent {
  isSideNavCollapsed = false;
  screenWidth = 0;
  
  onToggleSideNav(data: {screenWidth: number, collapsed: boolean}): void {
    this.screenWidth = data.screenWidth;
    this.isSideNavCollapsed = data.collapsed;
  }
}