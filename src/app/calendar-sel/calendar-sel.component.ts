import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ViewEncapsulation,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import {

  CalendarMonthViewDay,
  CalendarView,
  CalendarEventTitleFormatter,
  CalendarWeekViewBeforeRenderEvent,
  DAYS_OF_WEEK,
  CalendarDateFormatter,
  CalendarEvent,
} from 'angular-calendar';
import {  KeycloakService } from 'keycloak-angular';
import { WeekDay, WeekViewHourSegment, WeekViewHourColumn, EventAction, EventColor } from 'calendar-utils';
import { CalendarHeaderComponent } from '../demo-utils/calendar-header.component';
import { CustomEventTitleFormatter } from '../demo-utils/custom-event-title-formatter.provider';
import { CustomDateFormatter } from '../demo-utils/custom-date-formatter.provider';
import { colors } from '../demo-utils/colors';
import { BookingEvent } from '../demo-utils/event-b';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import {
  startOfDay,
  endOfDay,
  subDays,
  addMinutes,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  isBefore,
  isSameDay,
  isSameMonth,
  addHours,
  nextDay,
  startOfTomorrow,
  startOfToday,
  startOfHour,
  isAfter,
} from 'date-fns';
import { BookingDataService } from '../service/data/booking-data.service';
import { EventData } from './event-data';
import { KeycloakProfile } from 'keycloak-js';
import { createElementCssSelector } from '@angular/compiler';
import { BookingEntityDataService } from 'app/service/data/booking-entity-data.service';
import { _BookingEntity } from 'app/booking-entity/models';


@Component({
  selector: 'app-calendar-sel',
  templateUrl: './calendar-sel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./calendar-sel.component.css',],
  // don't do this in your app, its only so the styles get applied globally
  styles: [
    `
      .cal-day-selected,
      .cal-day-selected:hover {
        background-color: deeppink !important;
      }
      .cal-weekends,
      .cal-weekends:hover {
        background-color: darkgrey !important;
      }

      .cal-month-view .cal-day-cell.cal-past,
      .cal-month-view .cal-day-cell.cal-past:hover {
        background-color: lightgrey;
      }

      .cal-month-view .cal-day-cell.cal-today .cal-day-number {
        font-size: 1.2em ;
      }

      .cal-month-view .cal-day-number {
        font-size: 1.2em;
        font-weight: 900;
        opacity: 0.7;
        margin-top: 10px;
        margin-right: 1%;
        float: right;
        margin-bottom: 10px;
      }

      .cal-month-view .cal-day-cell {
        min-height: 60px;
      }
      .cal-month-view .cal-day-cell.cal-today {
        background-color: #e8fde7;
      }
      .cal-month-view .cal-cell-top {
        min-height: 45px;
        -webkit-box-flex: 1;
        -ms-flex: 1;
        flex: 1;
      }

      .cal-month-view .cal-cell-foot {
        min-height: 15px;
        -webkit-box-flex: 1;
        -ms-flex: 1;
        flex: 1;
      }

      .cal-month-view .cal-day-badge {
        margin-top: 1%;
        margin-left: 1%;
        display: inline-block;
        min-width: 10px;
        padding: 3px 7px;
        background-color: green;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        border-radius: 2px;
      }
    `,
  ],
  providers: [
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatter,
    },
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class CalendarSelComponent  implements OnInit, OnDestroy {

  view: CalendarView = CalendarView.Month;

  viewDate: Date = new Date();

  selectedMonthViewDay: CalendarMonthViewDay;

  selectedDayViewDate: Date;

  weekStartsOn: number = DAYS_OF_WEEK.SUNDAY;

  weekendDays: number[] = [DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY];

  hourColumns: WeekViewHourColumn[];

  bookingEntity: _BookingEntity;

  hourSegmentHeight: number = 10;

  hourSegments: number = 6;

  gid: string;

  dayStartHour: number;
  dayStartMinute: number;
  dayStart: number; // = this.dayStartHour * 60 + this.dayStartMinute;

  dayEndHour: number;
  dayEndMinute: number;
  dayEnd: number; // = this.dayEndHour * 60 + this.dayEndMinute;

  lunchBreakStartHr: number;
  lunchBreakStartMin: number;
  lunchBreakStart : number; //= this.lunchBreakStartHr * 60 + this.lunchBreakStartMin;

  // lunchBreakDurationHr: number = 1;
  // lunchBreakDurationMin: number = 0;
  lunchBreakEnd : number; //= this.lunchBreakStart + this.lunchBreakDurationHr * 60 + this.lunchBreakDurationMin;

  // sessionTakenHr: number = 0;
  // sessionTakenMin: number = 45;
  sessionTaken : number; //= this.sessionTakenHr * 60 + this.sessionTakenMin;

  // intervalBreakHr: number = 0;
  // intervalBreakMin: number = 5;
  intervalBreak : number; //= this.intervalBreakHr * 60 + this.intervalBreakMin;
  //LastSessionHour: number = this.dayEndHour - 1;

  //minAdvanceBookingHr = 0;
  //minAdvanceBookingDay = 2;
  //maxAdvanceBookingDay = 100;

  minAdvanceBookingUnit: string ;
  minAdvanceBooking: number;
  maxAdvanceBookingInDay: number;

  bookAllowFromHr: number = 0;
  bookAllowFromMin: number = 0;
  bookAllowFrom: number = 0;


  events: EventData[] = []; //CalendarEvent[] = [];
  eventDataArry: EventData[] = [];

  eventBook: BookingEvent;

  eventBs: BookingEvent[];

  eveA: CalendarEvent[] = [];

  workingDays: number[] = [];

  daysInWeek = 7;

  viewDateDec: number;

  isLoggedIn: Boolean = false;

  randomNumberChangeDetect: number = 0;



  breaks: any[] = [{ name: "lunch break", time : { hour:1, minute:0 }, duration : { hour:1, minute:0 } }]

  public userProfile: KeycloakProfile | null = null;

  private destroy$ = new Subject();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private cd: ChangeDetectorRef,
    private bookingService: BookingDataService,
    private bookingEntityDataService: BookingEntityDataService,
    protected readonly keycloakService: KeycloakService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    console.log("start1 " + this.userProfile);
    this.isLoggedIn = await this.keycloakService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloakService.loadUserProfile();
      console.log(this.userProfile);
    }
    this.gid = this.route.snapshot.paramMap.get('gid');
      //"818ad340-f62b-f309-6553-be72bf0ec302";
      console.log(this.gid);
    this.bookingEntityDataService.getBookingEntity(this.gid).subscribe(
      response => {

        this.bookingEntity = response as _BookingEntity;
        this.dayStartHour = this.bookingEntity.dayStartM.hour;
        this.dayStartMinute = this.bookingEntity.dayStartM.minute;
        this.dayStart = this.bookingEntity.dayStartM.hour * 60 + this.bookingEntity.dayStartM.minute;

        this.dayEndHour = this.bookingEntity.dayEndM.hour;
        this.dayEndMinute = this.bookingEntity.dayEndM.minute;
        this.dayEnd = this.bookingEntity.dayEndM.hour * 60 + this.bookingEntity.dayEndM.minute;

        this.lunchBreakStart = this.bookingEntity.breakStartM.hour * 60 + this.bookingEntity.breakStartM.minute;
        this.lunchBreakEnd = this.lunchBreakStart + this.bookingEntity.breakDurationM.hour * 60 + this.bookingEntity.breakDurationM.minute;
        this.sessionTaken = this.bookingEntity.sessionM.hour * 60 + this.bookingEntity.sessionM.minute;
        this.intervalBreak = this.bookingEntity.intervalBreakM.hour * 60 + this.bookingEntity.intervalBreakM.minute;
        this.minAdvanceBookingUnit = this.bookingEntity.minAdvanceBookingUnit;
        this.minAdvanceBooking = this.bookingEntity.minAdvanceBooking;
        this.maxAdvanceBookingInDay = this.bookingEntity.maxAdvanceBookingInDay;
        this.workingDays = this.bookingEntity.workingDays;

        console.log(this.bookingEntity.minAdvanceBookingUnit);
        this.prepareFrontEndData();
        this.updateWithBackEndData();
      },
      error => {
        console.log(error);
      }
    );


    const CALENDAR_RESPONSIVE = {
      small: {
        breakpoint: '(max-width: 576px)',
        daysInWeek: 3,
        viewDateDec: 1,
      },
      medium: {
        breakpoint: '(max-width: 768px)',
        daysInWeek: 5,
        viewDateDec: 2,
      },
      large: {
        breakpoint: '(max-width: 960px)',
        daysInWeek: 7,
        viewDateDec: 3,
      },
    };

    this.breakpointObserver
      .observe(
        Object.values(CALENDAR_RESPONSIVE).map(({ breakpoint }) => breakpoint)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: BreakpointState) => {
        const foundBreakpoint = Object.values(CALENDAR_RESPONSIVE).find(
          ({ breakpoint }) => !!state.breakpoints[breakpoint]
        );
        if (foundBreakpoint) {
          this.daysInWeek = foundBreakpoint.daysInWeek;
          this.viewDateDec = foundBreakpoint.viewDateDec;
        } else {
          this.daysInWeek = 7;
          this.viewDateDec = 3;
        }
        this.cd.markForCheck();
      });
  }


  ngOnDestroy() {
    this.destroy$.next();
  }


  updateWithBackEndData() {
    console.log("start");
    console.log(this.gid);
    this.bookingService.getBookingsByGid(this.gid).subscribe(
      response => {
        console.log(response);
        this.eventDataArry = response;
        console.log(this.eventDataArry);
        console.log(this.events);
        if (this.eventDataArry.length > 0) {
          for (let event of this.eventDataArry) {
            this.events = this.events.map((iEvent) => {

              if (iEvent.start.getTime() === Date.parse(event.start + ".000Z") &&
              iEvent.end.getTime() === Date.parse(event.end + ".000Z") ) {
                console.log("iii " + iEvent.start.getTime() + " - " + Date.parse(event.start + ".000Z"));
                //console.log(iEvent.bookerEmail === this.userProfile.email);
                
                //console.log(this.userProfile.email);
                iEvent.color = colors.red;
                console.log(event.bookerEmail);
                console.log(this.userProfile);
                if ((event.bookerEmail != null || "") && (this.userProfile != null || "") ) {
                  if (( event.bookerEmail === this.userProfile.email )) {
                    iEvent.color = colors.yellow; //event.color;
                    console.log(event.bookerEmail);
                  }
                }
                               
                iEvent.id = event.id;
                iEvent.meta.incrementsBadgeTotal = false;
                if (event.meta != null) {
                  if (event.meta.email != null) {
                    iEvent.meta.email = event.meta.email;
                  }
                }
                if (event.bookerEmail != null) {
                    iEvent.bookerEmail = event.bookerEmail;
                }

                iEvent.bookingEntityGid = this.bookingEntity.gid;
                iEvent.bookingEntityName = this.bookingEntity.title_1;
              }
              return iEvent;
            });
          }
        }
        this.randomNumberChangeDetect = Math.random();
        this.cd.markForCheck();
        console.log("backend update " + this.randomNumberChangeDetect);

      },
      error => {
        console.log(error);
      }
    );
  }

  prepareFrontEndData() {
    console.log('prepareFrontEndData');
    let start = startOfDay(new Date());
    if (this.minAdvanceBookingUnit == "day") {
      start = addDays(start, this.minAdvanceBooking);
      this.bookAllowFrom = 0;
    }

    for (let i = start;
        isBefore(i, endOfMonth(addMonths(new Date(), 1)));
      i = addDays(i, 1)) {
      
      console.log('allow from ', startOfDay(i).getTime() === startOfToday().getTime() && this.minAdvanceBookingUnit == "hour");

      if (startOfDay(i).getTime() === startOfToday().getTime() && this.minAdvanceBookingUnit == "hour") {
        let bookAllowFromHour: number = startOfHour(new Date()).getHours() + this.minAdvanceBooking;
        let bookAllowFromMinute: number = startOfHour(new Date()).getMinutes();
        this.bookAllowFrom = bookAllowFromHour * 60 + bookAllowFromMinute;
      }
      else {
        this.bookAllowFrom = 0
      }


    if (this.workingDays.includes(i.getDay())) {       
      for (let j = this.dayStart > this.bookAllowFrom ? this.dayStart : this.bookAllowFrom;
        j + this.sessionTaken <= this.lunchBreakStart;
        j = j + this.sessionTaken + this.intervalBreak) {
        console.log(j);
        this.events.push({
          title: '',
          start: addMinutes(i, j),
          end: addMinutes(i, j + this.sessionTaken),
          color: colors.green,
          bookingEntityGid: this.bookingEntity.gid,
          meta: {
            incrementsBadgeTotal: true,
          },
        });
      }

      for (let j = this.lunchBreakEnd > this.bookAllowFrom ? this.lunchBreakEnd : this.bookAllowFrom;
        j + this.sessionTaken <= this.dayEnd;
        j = j + this.sessionTaken + this.intervalBreak) {
        this.events.push({
          title: '',
          start: addMinutes(i, j),
          end: addMinutes(i, j + this.sessionTaken),
          color: colors.green,
          bookingEntityGid: this.bookingEntity.gid,
          meta: {
            incrementsBadgeTotal: true,
          },
        });
      }
    }
    // for (let i = startOfTomorrow();
    //   isBefore(i, endOfMonth(addMonths(new Date(), 1)));
    //   i = addDays(i, 1)) {
    //     if (! this.weekendDays.includes(i.getDay()) ) {
    //       for (let j = this.dayStartHour; j < this.dayEndHour; j++) {
    //         if (j != this.lunchBreakStart) {
    //           this.events.push({
    //             title: '',
    //             start: addHours(i, j),
    //             end: addHours(i, j + 1),
    //             color: colors.green,
    //             meta: {
    //               incrementsBadgeTotal: true,
    //             },
    //           }
    //           );
    //         }
    //       }
    //   }
    // }

    }
  }


  changeDay(date: Date) {
    if ( !isBefore(  date, startOfToday()) ){
      this.viewDate = date;
      console.log(this.viewDate);
      if (this.viewDate.getDay() > this.viewDateDec) {
        this.viewDate.setDate(this.viewDate.getDate() - this.viewDateDec);
      }   
      console.log(this.viewDate);
      console.log(this.viewDateDec);
      this.view = CalendarView.Week;
    }
  }

  eventClicked({ event }: { event: EventData }): void { //{ event: CalendarEvent }): void {
    console.log("1 " + this.isLoggedIn);
    //this.keycloakService.isLoggedIn().then(status => { this.isLoggedIn = status; console.log("2 " +this.isLoggedIn); });
    console.log("3 " + this.isLoggedIn);

    var loginPromise =  this.keycloakService.isLoggedIn();
    loginPromise.then((value) => {
      if (value) {
        ///console.log('Event clicked ' + value);
        //console.log(event.color);
        if (JSON.stringify(event.color) === JSON.stringify(colors.green)) {
          if (confirm("Confirm booking?")) {
            var eventCopy = event;
            eventCopy.color = colors.red;
            eventCopy.bookerEmail = this.userProfile.email;
            eventCopy.bookingEntityName = this.bookingEntity.title_1;
            eventCopy.bookingEntityGid = this.bookingEntity.gid;

            this.bookingService.createBooking(eventCopy).subscribe(
              response => {
                this.events = this.events.map((iEvent) => {
                  //console.log(iEvent);
                  if (iEvent.start.getTime() === Date.parse(eventCopy.start + ".000Z") &&
                  iEvent.end.getTime() === Date.parse(eventCopy.end + ".000Z")) {
                    //console.log("iii " + iEvent.start.getTime() + " - " + Date.parse(eventCopy.start + ".000Z"));
                    iEvent.color = eventCopy.color;
                    iEvent.meta.incrementsBadgeTotal = false;

                    iEvent.bookerEmail = this.userProfile.email;
                    iEvent.bookingEntityGid = this.bookingEntity.gid;
                    iEvent.bookingEntityName = this.bookingEntity.title_1;

                  }
                  console.log('iEvent ' );
                  console.log(iEvent);
                  return iEvent;
                });
                console.log(response);
                this.updateWithBackEndData();
              },
              error => {
                console.log(error);
              }
            );
            console.log('Event clicked', event);
          }
          return value;
        }
        else if ( ( JSON.stringify(event.color) === JSON.stringify(colors.yellow ) ) &&
                  ( event.bookerEmail != null || "" ) &&
                  ( event.bookerEmail === this.userProfile.email ) ) {
          if (confirm("Cancel booking?")) {
            var eventCopy = event;
            eventCopy.color = colors.green;
            eventCopy.id = event.id;
            this.bookingService.deleteBooking(event.id).subscribe(
              response => {
                this.events = this.events.map((iEvent) => {
                  if (iEvent.start.getTime() === Date.parse(eventCopy.start + ".000Z") &&
                  iEvent.end.getTime() === Date.parse(eventCopy.end + ".000Z")) {
                    //console.log("iii " + iEvent.start.getTime() + " - " + Date.parse(eventCopy.start + ".000Z"));
                    iEvent.color = colors.green;
                    iEvent.id = null;
                    iEvent.meta.incrementsBadgeTotal = true;

                    iEvent.bookerEmail = null;
                    iEvent.bookingEntityGid = eventCopy.bookingEntityGid;
                    iEvent.bookingEntityName = null;

                  }
                  return iEvent;
                });

                console.log(response);
                this.updateWithBackEndData();
              },
              error => {
                console.log(error);
              }
            );
            console.log('Event clicked', event);
          }
          return value;
        }
      }
      else {
        console.log("4 " + this.isLoggedIn);
        this.keycloakService.login(
          //{redirectUri: "http://localhost:4200/select",}
        );
        return value;
      }
    }).catch( (error) => {
      console.log("4 " + this.isLoggedIn + " " + error);

    });

  }

  beforeMonthViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    body.forEach((day) => {
      day.badgeTotal = day.events.filter(
        (event) => event.meta.incrementsBadgeTotal
      ).length;
      if (day.date.getDay() === 0 || day.date.getDay() === 6) {
        day.cssClass = 'cal-weekends';
      }
      console.log(day.badgeTotal);
    });
    console.log('beforeRender');
  }

  hourSegmentClicked(date: Date) {
    this.selectedDayViewDate = date;
  }

  beforeWeekOrDayViewRender(event: CalendarWeekViewBeforeRenderEvent) {
    this.hourColumns = event.hourColumns;
  }

}
