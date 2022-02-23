class ManageProjectsController extends AdminBaseController
{

    use ProjectProgress;

    public function __construct()
    {
        parent::__construct();
        $this->pageTitle = __('app.menu.projects');
        $this->pageIcon = 'icon-layers';
        $this->middleware(function ($request, $next) {
            if (!in_array('projects', $this->user->modules)) {
                abort(403);
            }
            return $next($request);
        });
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $this->totalProjects = Project::all()->count();
        $this->finishedProjects = Project::completed()->count();
        $this->inProcessProjects = Project::inProcess()->count();
        $this->onHoldProjects = Project::onHold()->count();
        $this->canceledProjects = Project::canceled()->count();
        $this->notStartedProjects = Project::notStarted()->count();

        $this->clients = Client::all();
        $this->categories = ProjectCategory::all();


        return view('admin.projects.index', $this->data);
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function archive()
    {
        $this->totalProjects = Project::onlyTrashed()->count();
        $this->clients = Client::all();
        return view('admin.projects.archive', $this->data);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $this->currencies = Currency::all();
        $this->states = Config::get('constants.states');
        $this->designers = User::allDesigners();
        $this->clients = Client::all();
        $this->installers = User::allInstallers();
        return view('admin.projects.create', $this->data);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreProject $request)
    {
        $project = new Project();
        $project->project_name = $request->project_name;
        $project->address1 = $request->address1;
        $project->address2 = $request->address2;
        $project->city = $request->city;
        $project->state = $request->state;
        $project->zip = $request->zip;
        $project->contact = $request->contact;
        $project->phone = $request->phone;
        $project->ext = $request->ext;
        $project->cell = $request->cell;
        $project->cell_contact = $request->cell_contact;
        $project->cell2 = $request->cell2;
        $project->cell2_contact = $request->cell2_contact;
        $project->fax = $request->fax;
        $project->email = $request->email;
        $project->second_email = $request->second_email;
        if(!empty($request->install_start_date))
            $project->install_start_date = Carbon::createFromFormat($this->global->date_format, $request->install_start_date)->format('Y-m-d');
        if(!empty($request->install_end_date))
            $project->install_end_date = Carbon::createFromFormat($this->global->date_format, $request->install_end_date)->format('Y-m-d');
        $project->status = $request->status;
        $project->sales_price = $request->sales_price;
        if(!empty($request->sold_date))
            $project->sold_date = Carbon::createFromFormat($this->global->date_format, $request->sold_date)->format('Y-m-d');
        $project->discount = $request->discount;
        $project->discount_type = $request->discount_type;
        $project->commission = $request->commission;
        $project->commission_type = $request->commission_type;
        $project->user_id = $request->user_id;
        $project->client_id = $request->client_id;
        $project->save();

        if($request->installers){
            foreach($request->installers as $userId){
                ProjectInstaller::create(['user_id' => $userId, 'project_id' => $project->id]);
            }
        }

        $this->logSearchEntry($project->id, 'Project: ' . $project->project_name, 'admin.projects.show');

        $this->logProjectActivity($project->id, ucwords($project->project_name) . ' ' . __("messages.addedAsNewProject"));


        if ($request->has('leadDetail')) {
            $lead = Lead::findOrFail($request->leadDetail);
            $lead->project_id = $project->id;
            $lead->save();

            return Reply::redirect(route('admin.leads.index'), __('messages.leadProjectChangeSuccess'));
        }

        return Reply::redirect(route('admin.projects.index'), __('modules.projects.projectUpdated'));
    }

    /**
     * Display the specified resource.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $this->project = Project::with('installers', 'installers.user')->findOrFail($id)->withCustomFields();
        $this->fields = $this->project->getCustomFieldGroupsWithFields()->fields;

        $this->activeTimers = ProjectTimeLog::projectActiveTimers($this->project->id);
        $this->openTasks = Task::projectOpenTasks($this->project->id);
        $this->openTasksPercent = (count($this->openTasks) == 0 ? "0" : (count($this->openTasks) / count($this->project->tasks)) * 100);

        $this->daysLeft = 0;
        $this->daysLeftFromStartDate = 0;
        $this->daysLeftPercent = 0;

        if (is_null($this->project->deadline)) {
            $this->daysLeft = 0;
        } else {
            if ($this->project->deadline->isPast()) {
                $this->daysLeft = 0;
            } else {
                $this->daysLeft = $this->project->deadline->diff(Carbon::now())->format('%d') + ($this->project->deadline->diff(Carbon::now())->format('%m') * 30) + ($this->project->deadline->diff(Carbon::now())->format('%y') * 12);
            }
            $this->daysLeftFromStartDate = $this->project->deadline->diff($this->project->start_date)->format('%d') + ($this->project->deadline->diff($this->project->start_date)->format('%m') * 30) + ($this->project->deadline->diff($this->project->start_date)->format('%y') * 12);
            $this->daysLeftPercent = ($this->daysLeftFromStartDate == 0 ? "0" : (($this->daysLeft / $this->daysLeftFromStartDate) * 100));
        }
        

        $this->hoursLogged = ProjectTimeLog::projectTotalMinuts($this->project->id);

        $hour = intdiv($this->hoursLogged, 60);

        if (($this->hoursLogged % 60) > 0) {
            $minute = ($this->hoursLogged % 60);
            $this->hoursLogged = $hour . 'hrs ' . $minute . ' mins';
        } else {
            $this->hoursLogged = $hour;
        }

        $this->recentFiles = ProjectFile::where('project_id', $this->project->id)
            ->orderBy('id', 'desc')->limit(10)->get();
        $this->activities = ProjectActivity::getProjectActivities($id, 10);
        //        $this->completedTasks = Task::projectCompletedTasks($this->project->id);
        $this->milestones = ProjectMilestone::with('currency')->where('project_id', $id)->get();
        $this->earnings = Payment::where('status', 'complete')
            ->where('project_id', $id)
            ->sum('amount');
        $this->expenses = Expense::where(['project_id' => $id, 'status' => 'approved'])->sum('price');

        return view('admin.projects.show', $this->data);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $this->project = Project::findOrFail($id);
        if(!is_null($this->project->sold_date))
            $this->project->sold_date = Carbon::createFromFormat('Y-m-d', $this->project->sold_date)->format($this->global->date_format);
        if(!is_null($this->project->install_start_date))
            $this->project->install_start_date = Carbon::createFromFormat('Y-m-d', $this->project->install_start_date)->format($this->global->date_format);
        if(!is_null($this->project->install_end_date))
            $this->project->install_end_date = Carbon::createFromFormat('Y-m-d', $this->project->install_end_date)->format($this->global->date_format);
        $this->currencies = Currency::all();
        $this->states = Config::get('constants.states');
        $this->designers = User::allDesigners();
        $this->clients = Client::all();
        $this->installers = User::allInstallers();
        $this->attendees = [];
        if(!empty($this->project->installers))
            $this->attendees = $this->project->installers->pluck('user_id')->toArray();

        $payments = Payment::where('project_id', '=',$id)->where('status', 'complete')->get();
        $this->paid_amount = 0;
        foreach ($payments as $payment){
            $this->paid_amount += $payment->amount;
        }

        $this->commissions = DB::table('commissions')
            ->select(
                DB::raw('(select sum(commissions.amount) from `commissions` where `project_id`='.$id.') as totalCommissions'),
                DB::raw('(select sum(commissions.amount) from `commissions` where `project_id`='.$id.' and `status`="paid") as paidCommissions '),
                DB::raw('(select sum(commissions.amount) from `commissions` where `project_id`='.$id.' and `status`="pending") as pendingCommissions')
            )
            ->first();

        return view('admin.projects.edit', $this->data);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function update(StoreProject $request, $id)
    {
        $project = Project::findOrFail($id);
        $project->project_name = $request->project_name;
        $project->address1 = $request->address1;
        $project->address2 = $request->address2;
        $project->city = $request->city;
        $project->state = $request->state;
        $project->zip = $request->zip;
        $project->contact = $request->contact;
        $project->phone = $request->phone;
        $project->ext = $request->ext;
        $project->cell = $request->cell;
        $project->cell_contact = $request->cell_contact;
        $project->cell2 = $request->cell2;
        $project->cell2_contact = $request->cell2_contact;
        $project->fax = $request->fax;
        $project->email = $request->email;
        $project->second_email = $request->second_email;
        if(!empty($request->install_start_date))
            $project->install_start_date = Carbon::createFromFormat($this->global->date_format, $request->install_start_date)->format('Y-m-d');
        if(!empty($request->install_end_date))
            $project->install_end_date = Carbon::createFromFormat($this->global->date_format, $request->install_end_date)->format('Y-m-d');
        $project->status = $request->status;
        $project->sales_price = str_replace(',', '', $request->sales_price);
        if(!empty($request->sold_date))
            $project->sold_date = Carbon::createFromFormat($this->global->date_format, $request->sold_date)->format('Y-m-d');
        $project->discount = $request->discount;
        $project->discount_type = $request->discount_type;
        $project->commission = $request->commission;
        $project->commission_type = $request->commission_type;
        $project->user_id = $request->user_id;
        $project->client_id = $request->client_id;
        $project->save();

        ProjectInstaller::where('project_id', $project->id)->delete();
        $schedule = InstallSchedule::where('project_id', $project->id)->first();

        if(!empty($schedule->attendees)){
            foreach ($schedule->attendees as $attendee){
                $attendee->delete();
            }
        }
        if($request->installers){
            foreach($request->installers as $userId){
                ProjectInstaller::create(['user_id' => $userId, 'project_id' => $project->id]);
                if(!empty($schedule)){
                    InstallScheduleAttendee::create(['user_id' => $userId, 'schedule_id' => $schedule->id]);
                }
            }
        }

        $this->logProjectActivity($project->id, ucwords($project->project_name) . __('modules.projects.projectUpdated'));
        return Reply::redirect(route('admin.projects.index'), __('messages.projectUpdated'));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
    
        $project = Project::withTrashed()->findOrFail($id);

        //delete project files
        // Files::deleteDirectory('project-files/' . $id);

        $project->forceDelete();
        $leads = Lead::where('project_id', $id)->get();
        foreach ($leads as $lead){
            $lead->project_id = NULL;
            $lead->save();
        }

        return Reply::success(__('messages.projectDeleted'));
    }

    public function data(Request $request)
    {

        $projects = Project::leftJoin('users', 'users.id', 'projects.user_id')
                    ->leftJoin('clients', 'clients.id', 'projects.client_id')
                    ->select('projects.id', 'projects.project_name', 'projects.status', 'projects.created_at', 'clients.first_name as client_first_name', 'clients.last_name as client_last_name', 'users.name as designer');

        if (!is_null($request->status) && $request->status != 'all') {
            $projects->where('status', $request->status);
        }

        if (!is_null($request->client_id) && $request->client_id != 'all') {
            $projects->where('client_id', $request->client_id);
        }

        if (!is_null($request->category_id) && $request->category_id != 'all') {
            $projects->where('category_id', $request->category_id);
        }

        $projects = $projects->orderBy('created_at', 'DESC')->get();

        return DataTables::of($projects)
            ->addColumn('action', function ($row) {
                $action = '<div class="btn-group m-r-10">
                <button aria-expanded="false" data-toggle="dropdown" class="btn btn-info btn-outline  dropdown-toggle waves-effect waves-light" type="button">'.__('modules.lead.action').'  <span class="caret"></span></button>
                <ul role="menu" class="dropdown-menu">
                    <li><a href="'.route('admin.projects.show', $row->id).'"><i class="fa fa-search"></i> '.__('modules.lead.view').'</a></li>
                    <li><a href="'.route('admin.projects.edit', $row->id).'"><i class="fa fa-edit"></i> '.__('modules.lead.edit').'</a></li>
                    <li><a href="javascript:;" class="sa-params" data-user-id="'.$row->id.'"><i class="fa fa-trash "></i> '.__('app.delete').'</a></li>  
                </ul>
              </div>';
                return $action;
            })
            ->editColumn('project_name', function ($row) {
                return ucfirst($row->project_name);
            })
            ->editColumn('created_at', function ($row) {
                return $row->created_at->format($this->global->date_format);
            })
            ->editColumn('status', function ($row) {

                if ($row->status == 'in progress') {
                    $status = '<label class="label label-info">' . __('app.inProgress') . '</label>';
                } else if ($row->status == 'on hold') {
                    $status = '<label class="label label-warning">' . __('app.onHold') . '</label>';
                } else if ($row->status == 'not started') {
                    $status = '<label class="label label-warning">' . __('app.notStarted') . '</label>';
                } else if ($row->status == 'canceled') {
                    $status = '<label class="label label-danger">' . __('app.canceled') . '</label>';
                } else if ($row->status == 'completed') {
                    $status = '<label class="label label-success">' . __('app.completed') . '</label>';
                }
                return $status;
            })
            ->addColumn('client', function ($row) {
                return ucfirst($row->client_first_name).' '.ucfirst($row->client_last_name);
            })
            ->addColumn('installers', function ($row) {
                $installers = '';

                if (count($row->installers) > 0) {
                    foreach ($row->installers as $installer) {
                        $installers .= ($installer->user->image) ? '<img data-toggle="tooltip" data-original-title="' . ucwords($installer->user->name) . '" src="' . asset_url('avatar/' . $installer->user->image) . '"
                        alt="user" class="img-circle" width="30"> ' : '<img data-toggle="tooltip" data-original-title="' . ucwords($installer->user->name) . '" src="' . asset('img/default-profile-2.png') . '"
                        alt="user" class="img-circle" width="30"> ';
                    }
                } else {
                    $installers .= __('messages.noMemberAddedToProject');
                }
                return $installers;
            })
            ->rawColumns(['action', 'created_at', 'status', 'installers'])
            ->removeColumn('client_first_name')
            ->removeColumn('client_last_name')
            ->make(true);
    }

    public function export($status = null, $clientID = null)
    {
        $projects = Project::leftJoin('users', 'users.id', '=', 'projects.client_id')
            ->leftJoin('project_category', 'project_category.id', '=', 'projects.category_id')
            ->select(
                'projects.id',
                'projects.project_name',
                'users.name',
                'project_category.category_name',
                'projects.start_date',
                'projects.deadline',
                'projects.completion_percent',
                'projects.created_at'
            );
        if (!is_null($status) && $status != 'all') {
            if ($status == 'incomplete') {
                $projects = $projects->where('completion_percent', '<', '100');
            } elseif ($status == 'complete') {
                $projects = $projects->where('completion_percent', '=', '100');
            }
        }

        if (!is_null($clientID) && $clientID != 'all') {
            $projects = $projects->where('client_id', $clientID);
        }

        $projects = $projects->get();

        // Initialize the array which will be passed into the Excel
        // generator.
        $exportArray = [];

        // Define the Excel spreadsheet headers
        $exportArray[] = ['ID', 'Project Name', 'Client Name', 'Category', 'Start Date', 'Deadline', 'Completion Percent', 'Created at'];

        // Convert each member of the returned collection into an array,
        // and append it to the payments array.
        foreach ($projects as $row) {
            $exportArray[] = $row->toArray();
        }

        // Generate and return the spreadsheet
        Excel::create('Projects', function ($excel) use ($exportArray) {

            // Set the spreadsheet title, creator, and description
            $excel->setTitle('Projects');
            $excel->setCreator('Worksuite')->setCompany($this->companyName);
            $excel->setDescription('Projects file');

            // Build the spreadsheet, passing in the payments array
            $excel->sheet('sheet1', function ($sheet) use ($exportArray) {
                $sheet->fromArray($exportArray, null, 'A1', false, false);

                $sheet->row(1, function ($row) {

                    // call row manipulation methods
                    $row->setFont(array(
                        'bold'       =>  true
                    ));
                });
            });
        })->download('xlsx');
    }

    public function updateTaskDuration(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $task->start_date = Carbon::createFromFormat('d/m/Y', $request->start_date)->format('Y-m-d');
        $task->due_date = Carbon::createFromFormat('d/m/Y', $request->end_date)->format('Y-m-d');
        $task->save();

        return Reply::success('messages.taskUpdatedSuccessfully');
    }

    public function updateStatus(Request $request, $id)
    {
        $project = Project::find($id)
            ->update([
                'status' => $request->status
            ]);

        return Reply::dataOnly(['status' => 'success']);
    }

    public function ajaxCreate(Request $request, $projectId)
    {
        $this->projectId = $projectId;
        $this->projects = Project::all();
        $this->employees = ProjectInstaller::byProject($projectId);
        $this->pageName = 'ganttChart';
        $this->parentGanttId = $request->parent_gantt_id;
        return view('admin.tasks.ajax_create', $this->data);
    }
}
