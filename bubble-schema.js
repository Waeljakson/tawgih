"use strict";
/*
 * Mishkat / Bubble schema map V1.0.15
 * Exact Data Type / Field display names are derived from the Bubble screenshots supplied by the school.
 * Do not put Bubble admin tokens in frontend code.
 */
(function(global){
  global.MISHKAT_BUBBLE_SCHEMA = Object.freeze({
    version: "2026-08-10-r6-school-scope",
    dataTypes: {
      academicYear:"academic year", usersData:"Users Data", students:"Students", terms:"terms", school:"School",
      department:"Department", grades:"Grades", class:"Class", jobTitle:"job_titels",
      guidanceAttandance:"Guidance_Attandance", guidanceCases:"Guidance_Cases", guidanceCollective:"Guidance_Collective",
      guidanceContact:"Guidance_Contact", guidanceFail:"guidance_Fail", guidanceFailType:"Guidance_FailType",
      guidanceLate:"Guidance_Late", guidanceLog:"Guidance_Log", guidanceMettings:"Guidance_Mettings",
      guidanceObserv:"Guidance_observ", guidanceObservation:"Guidance_Observation", guidancePeriodic:"Guidance_Periodic",
      guidanceProblemBehav:"Guidance_ProblemBehav", guidanceProblemEdu:"Guidance_ProblemEdu",
      guidanceProject:"Guidance_Project", guidanceProjectProgress:"Guidance_Project_Progress", guidanceReason:"Guidance_Reason",
      guidanceSitu:"Guidance_Situ", guidanceSituation:"Guidance_Situation", guidanceSkills:"Guidance_Skills",
      guidanceStudentnotice:"guidance_Studentnotice", guidanceSubCollective:"Guidance_SubCollective",
      guidanceWay:"Guidance_Way", guidanceAction:"Guidance_Action", guidanceStatistics:"Guidance_Statistics",
      guidanceBehav:"Guidance_Behav", guidanceEdu:"Guidance_Edu",
      guidancePlan:"Guidance_Plan", guidancePlanItem:"Guidance_Plan_Item", guidanceEvent:"Guidance_Event",
      guidanceMessage:"Guidance_Message", guidancePresentation:"Guidance_Presentation",
      guidanceCertificate:"Guidance_Certificate", guidanceTemplate:"Guidance_Template"
    },
    fields: {
      academicYear:{active:"Active",end:"End",start:"start",title:"title"},
      usersData:{active:"Active",activitySchools:"activity schools",currentJob:"Current Job",dep:"Dep",depList:"Dep list",dob:"DOB",email:"Email",employeeCode:"Employee Code",enName:"En Name",familyName:"Family Name",firstName:"First Name",fullName:"Full Name",gender:"Gender",grades:"Grades",idNumber:"ID Number",isRegistered:"Is Registered",jobTitle:"job_titels",joinDate:"join Date",phoneNumber:"Phone Number",profilePic:"Profile Pic",schools:"Schools",secondName:"Second Name",students:"Students",user:"User",userType:"User Type",thirdName:"Third Name"},
      department:{depName:"Dep. Name",grade:"Grade",order:"Order",schools:"Schools",studentDepartment:"stu dep",type:"type"},
      students:{active:"Active",class:"Class",code:"code",dep:"Dep",enrollment:"enrollment",familyName:"Family Name",firstName:"First Name",fullName:"Full Name",grade:"grade",localId:"local id",nationalId:"National ID",parentPhone:"Parent phone",parents:"parents",school:"School",secondName:"Second Name",thirdName:"Third Name",user:"user"},

      guidanceAttandance:{academicYear:"Academic year",attDays:"AttDays",attDetails:"AttDetails",dep:"Dep",grade:"Grade",meetingDate:"MeetingDate",msgDate:"MsgDate",phone:"Phone",school:"School",student:"Student",term:"Term"},
      guidanceCases:{academicYear:"Academic Year",category:"Category",dep:"Dep",discoverDate:"DiscoverDate",grade:"Grade",phone:"Phone",plan:"plan",problem:"Problem",problemBasic:"ProblemBasic",problemConc:"ProblemConc",reasonTrans:"ReasonTrans",school:"School",sourceTrans:"sourcetrans",status:"statue",student:"Student",symbol:"Symbole",terms:"Terms"},
      guidanceCollective:{academicYear:"Academic year",collectiveDate:"Collective Date",collectiveName:"Collective name",collectiveTarget:"Collective target",dep:"Dep",duration:"Duration",evaluation:"Evaluation",grade:"grade",nextDate:"next Date",orders:"orders",procedures:"procedures",process:"Process",school:"School",student:"Student",term:"Term",tools:"Tools"},
      guidanceContact:{academicYear:"Academic Year",contactDate:"Contact_Date",dep:"Dep",details:"Details",grade:"Grade",phone:"Phone",reason:"Reason",school:"School",student:"Student",terms:"Terms",way:"Way"},
      guidanceFail:{academicYear:"academic year",dep:"Dep",details:"Details",failDate:"Fail Date",failType:"Fail type",grade:"grade",phone:"Phone",school:"school",student:"Student",subjects:"Subjects",term:"term"},
      guidanceFailType:{title:"Title"},
      guidanceLate:{academicYear:"Academic year",days:"Days",dep:"Dep",grade:"Grade",lateDetails:"LateDetails",meetingDate:"MeetingDate",msgDate:"MsgDate",phone:"Phone",school:"School",student:"Student",term:"Term"},
      guidanceLog:{absentDaysCount:"absent_days_Count",action:"Action",category:"category",dep:"Dep",details:"Details",grade:"Grade",messageDate:"MessageDate",problemBehav:"ProblemBehav",reason:"Reason",school:"School",setDate:"SetDate",situ:"situ",skills:"Skills",source:"Source",student:"student",type:"Type",way:"Way",academicYear:"year"},
      guidanceMettings:{academicYear:"Academic Year",dep:"Dep",details:"Details",grade:"Grade",meetingDate:"Meeting Date",meetingRelatives:"Metting Relatives",phone:"Phone",school:"School",terms:"Terms",student:"Student"},
      guidanceObserv:{title:"Title"},
      guidanceObservation:{academicYear:"Academic year",class:"class",dep:"Dep",grade:"grade",obserNotes:"Obser_Notes",observDate:"Observ Date",observLesson:"Observ Lesson",observNeed:"Observ Need",observationDuration:"Observation Duration",school:"School",student:"student",term:"term"},
      guidancePeriodic:{academicYear:"Academic year",dep:"Dep",details:"Details",grade:"grade",notice:"Notice",periodDate:"Perd Date",phone:"Phone",school:"School",student:"student",term:"Term"},
      guidanceProblemBehav:{title:"ProblemBehav_Title"},
      guidanceProblemEdu:{title:"ProblemEdu_Title"},
      guidanceProject:{dep:"dep",grade:"grade",lastDate:"Last Date",projectName:"Project_Name",school:"school",startDate:"Start Date",status:"Status",team:"Team",user:"user",week:"Week",year:"year"},
      guidanceProjectProgress:{dep:"dep",doDate:"Do Date",files:"Files",grade:"grade",project:"Project",school:"school",status:"status",week:"week"},
      guidanceReason:{title:"Title"},
      guidanceSitu:{description:"Situation_Discreption"},
      guidanceSituation:{academicYear:"Academic year",action:"Action",department:"Department",detail:"Detail",grade:"grade",phone:"Phone",school:"school",situ:"situ",situationDate:"SituationDate",source:"Source",student:"Student",terms:"Terms"},
      guidanceSkills:{title:"Title"},
      guidanceStudentnotice:{description:"Notice_description"},
      guidanceSubCollective:{academicYear:"Academic year",collectiveDate:"Collective Date",collectiveName:"Collective name",collectiveTarget:"Collective target",dep:"Dep",duration:"Duration",evaluation:"Evaluation",nextDate:"next Date",orders:"orders",procedures:"procedures",process:"Process",school:"School",target:"Target",term:"Term",tools:"Tools"},
      guidanceWay:{title:"Title"}, guidanceAction:{description:"Action_Description"},

      guidancePlan:{title:"Title",academicYear:"AcademicYear",term:"Term",guide:"Guide",school:"School",department:"Department",status:"Status",notes:"Notes",active:"Active",items:"Items"},
      guidancePlanItem:{plan:"Plan",title:"Title",description:"Description",category:"Category",startDate:"StartDate",endDate:"EndDate",targetGroup:"TargetGroup",grade:"Grade",class:"Class",students:"Students",responsible:"Responsible",executionStatus:"ExecutionStatus",executionPercent:"ExecutionPercent",actualExecutionDate:"ActualExecutionDate",evidence:"Evidence",notes:"Notes",completed:"Completed"},
      guidanceEvent:{title:"Title",eventDate:"EventDate",endDate:"EndDate",eventType:"EventType",description:"Description",guide:"Guide",school:"School",department:"Department",academicYear:"AcademicYear",term:"Term",student:"Student",planItem:"PlanItem",reminder:"Reminder",reminderDate:"ReminderDate",completed:"Completed",notes:"Notes"},
      guidanceMessage:{messageType:"MessageType",subject:"Subject",messageText:"MessageText",guide:"Guide",school:"School",department:"Department",academicYear:"AcademicYear",term:"Term",student:"Student",parentPhone:"ParentPhone",recipientEmployee:"RecipientEmployee",recipientType:"RecipientType",createdDateCustom:"CreatedDateCustom",sent:"Sent",sentDate:"SentDate",channel:"Channel",notes:"Notes"},
      guidancePresentation:{title:"Title",topic:"Topic",guide:"Guide",school:"School",department:"Department",academicYear:"AcademicYear",term:"Term",targetGroup:"TargetGroup",grade:"Grade",presentationData:"PresentationData",theme:"Theme",slidesCount:"SlidesCount",createdAt:"CreatedAt",updatedAt:"UpdatedAt",status:"Status"},
      guidanceCertificate:{student:"Student",studentName:"StudentName",certificateType:"CertificateType",reason:"Reason",issueDate:"IssueDate",guide:"Guide",school:"School",department:"Department",academicYear:"AcademicYear",term:"Term",schoolManager:"SchoolManager",certificateNumber:"CertificateNumber",template:"Template",notes:"Notes"},
      guidanceTemplate:{title:"Title",templateType:"TemplateType",content:"Content",active:"Active",gender:"Gender",department:"Department",school:"School",order:"Order",systemTemplate:"SystemTemplate"}
    },
    notes:{guidanceLog:"Bubble screenshot shows two fields displayed as 'year' (academic year and terms). Only the academic-year display name is mapped here until the API field keys are confirmed."},
    knownGuidanceTypes:["Guidance_Attandance","Guidance_Cases","Guidance_Collective","Guidance_Contact","guidance_Fail","Guidance_FailType","Guidance_Late","Guidance_Log","Guidance_Mettings","Guidance_observ","Guidance_Observation","Guidance_Periodic","Guidance_ProblemBehav","Guidance_ProblemEdu","Guidance_Project","Guidance_Project_Progress","Guidance_Reason","Guidance_Situ","Guidance_Situation","Guidance_Skills","Guidance_Statistics","guidance_Studentnotice","Guidance_SubCollective","Guidance_Way","Guidance_Action","Guidance_Behav","Guidance_Edu","Guidance_Plan","Guidance_Plan_Item","Guidance_Event","Guidance_Message","Guidance_Presentation","Guidance_Certificate","Guidance_Template"]
  });
})(window);

// Class display field in this Bubble deployment: Class.Titel
