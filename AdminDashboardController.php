class AdminDashboardController extends AdminBaseController
{
    use CurrencyExchange;

    public function __construct()
    {
        parent::__construct();
        $this->pageTitle = __('app.menu.dashboard');
        $this->pageIcon = 'icon-speedometer';
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $this->period = DashboardPeriod::where('id', 1)->first();
        if($this->period){
            if($this->period->period == 1){
                $this->fromDate = Carbon::today()->subMonths(1);
                $this->toDate = Carbon::today();
            }
            else if( $this->period->period == 2){
                $this->fromDate = Carbon::today()->subMonths(2);
                $this->toDate = Carbon::today();
            }
            else if($this->period->period == 3){
                $this->fromDate = Carbon::today()->subMonths(3);
                $this->toDate = Carbon::today();
            }
            else{
                if(!empty($this->period->from)){
                    $this->fromDate = Carbon::createFromFormat('Y-m-d', $this->period->from);
                }
                else{
                    $this->fromDate = Carbon::today()->subMonths(1);
                }
                if(!empty($this->period->to)){
                    $this->toDate = Carbon::createFromFormat('Y-m-d', $this->period->to);
                }
                else{
                    $this->toDate = Carbon::today();
                }
            }
        }
        else{
            $this->period = new DashboardPeriod();
            $this->period->timestamps = false;
            $this->period->period = 1;
            $this->period->save();
            $this->fromDate = Carbon::today()->subMonths(1);
            $this->toDate = Carbon::today();
        }

        $toDateStr = $this->toDate->addDay(1)->toDateString();
        $this->toDate->subDay(1);

        $this->counts = DB::table('users')
            ->select(
                DB::raw('(select count(leads.id) from `leads` where `leads`.created_at BETWEEN CAST(\''.$this->fromDate->toDateString().'\' AS DATE) AND CAST(\''.$toDateStr.'\' AS DATE)) as totalLeads'),
                DB::raw('(select count(leads.id) from `leads` where `leads`.status_id = 1 AND `leads`.created_at BETWEEN CAST(\''.$this->fromDate->toDateString().'\' AS DATE) AND CAST(\''.$toDateStr.'\' AS DATE)) as pendingLeads'),
                DB::raw('(select count(projects.id) from `projects` where `projects`.created_at BETWEEN CAST(\''.$this->fromDate->toDateString().'\' AS DATE) AND CAST(\''.$toDateStr.'\' AS DATE)) as totalProjects'),
                DB::raw('(select sum(projects.sales_price) from `projects` where `projects`.created_at BETWEEN CAST(\''.$this->fromDate->toDateString().'\' AS DATE) AND CAST(\''.$toDateStr.'\' AS DATE)) as totalSales')
            )
            ->first();

        $this->leadAllocation = User::join('role_user', 'role_user.user_id', '=', 'users.id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->join('leads', function($join) use ($toDateStr)
            {
                $join->on('leads.user_id', '=', 'users.id');
                $join->on('leads.created_at','>=',DB::raw("'".$this->fromDate->toDateString(). "'"));
                $join->on('leads.created_at','<',DB::raw("'". $toDateStr. "'"));
            })
            ->select('users.id', 'users.name', 'users.email', 'users.created_at', 'leads.id as lead_id', 'leads.first_name as lead_first_name', 'leads.last_name as lead_last_name')
            ->where('roles.name', 'designer')->orderBy('users.name', 'asc')->get();
        if($this->leadAllocation->count() > 0){
            $this->leadAllocation = $this->leadAllocation->groupBy('id');
        }

        $this->allTasks = User::join('role_user', 'role_user.user_id', '=', 'users.id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->leftJoin('task_attendees', 'task_attendees.user_id', '=', 'users.id')
            ->leftJoin('tasks', 'tasks.id', '=', 'task_attendees.task_id')
            ->select('users.id', 'users.name', 'users.email', 'users.created_at', 'tasks.id as task_id', 'tasks.heading as task_name', 'tasks.status as task_status')
            ->where('roles.name', 'designer')->orderBy('users.name', 'asc')->get();

        if($this->allTasks->count() > 0){
            $this->allTasks = $this->allTasks->groupBy('id');
        }

        $this->userTasks = Task::join('task_attendees', 'task_attendees.task_id', '=', 'tasks.id')->where('task_attendees.user_id', auth()->user()->id)->whereBetween('due_date', [$this->fromDate, $toDateStr])->get();
        $this->appointments = Event::where('end_date_time', '<=', Carbon::today()->endOfDay()->toDateTimeString())->where('start_date_time', '>=', Carbon::today()->startOfDay()->toDateTimeString())->orderBy('start_date_time','asc')->get();
        $this->installs = Project::where('install_start_date', '<', Carbon::tomorrow()->toDateString())->where('install_start_date', '>', Carbon::yesterday()->toDateString())->orderBy('install_start_date','asc')->get();

        $this->widgets = DashboardWidget::all();
        $this->activeWidgets = DashboardWidget::where('status', 1)->get()->pluck('widget_name')->toArray();

        return view('admin.dashboard.index', $this->data);
    }
}
