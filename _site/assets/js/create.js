// Click handler (jquery)
$(function() {

  $("#options").change(function() {
    config()
	});

  config();

  function config(){
    region = $("#region").val();
    os = $("#os").val();
    ami = $("#ami").val();
    disable_hyperthreading = $("#disable_hyperthreading").is(":checked");
    head_node_instance_type = $("#head_node_instance_type").val();
    key_name = $("#key_name").val();
    allowed_ips = $("#allowed_ips").val();
    subnet_id = $("#subnet_id").val();

    $("#code").html(`
Image:
  Os: ${os}
  CustomAmi: ${ami}
HeadNode:
  InstanceType: ${head_node_instance_type}
  DisableSimultaneousMultithreading: ${disable_hyperthreading}
  Networking:
    SubnetId: ${subnet_id}
  Ssh:
    KeyName: ${key_name}
  Imds:
    Secured: true
Scheduling:
  Scheduler: slurm
  SlurmQueues:
  - Name: gpu
    ComputeResources:
    - Name: gpu
      InstanceType: g4dn.8xlarge 
      MinCount: 0
      MaxCount: 100
    Networking:
      SubnetIds:
      - subnet-5eda8e04 
  - Name: cpu
    ComputeResources:
    - Name: cpu
      InstanceType: c5.24xlarge 
      MinCount: 0
      MaxCount: 100
    Networking:
      SubnetIds:
      - ${subnet_id}
SharedStorage:
  - Name: fsx
    MountDir: /fsx
    StorageType: FsxLustre
    FsxLustreSettings:
      StorageCapacity: 1200
      DeploymentType: SCRATCH_2`)
  }


});
